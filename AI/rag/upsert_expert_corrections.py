"""
전문가 교정 데이터를 MongoDB + Qdrant에 저장.
AI/분析결과/*.txt 파일을 파싱하여 type: "expert_correction"으로 적재.

실행 방법:
  docker-compose run ai python rag/upsert_expert_corrections.py
"""

import os
import re
import sys
import hashlib
import time
from pathlib import Path
from dotenv import load_dotenv
from google import genai
from google.genai import types
from fastembed import SparseTextEmbedding
from qdrant_client.models import PointStruct, SparseVector

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
load_dotenv()

from rag.db_utils import get_mongo_db, get_qdrant, LAW_COLLECTION, objectid_to_uuid

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if not GEMINI_API_KEY:
    raise RuntimeError("GEMINI_API_KEY가 설정되어 있지 않습니다.")

gemini_client = genai.Client(api_key=GEMINI_API_KEY)
bm25_model = SparseTextEmbedding(model_name="Qdrant/bm25")

DENSE_VECTOR_NAME = "dense"
SPARSE_VECTOR_NAME = "sparse"
MONGO_COLLECTION = "law_chunks"

_base = Path(__file__).parent.parent
CORRECTIONS_DIR = next(
    (p for p in _base.iterdir() if p.is_dir() and "결과" in p.name),
    _base / "분析결과",
)

# AI의견 / 전문가의견 마커 패턴
_AI_MARKER = re.compile(r'(?im)^ai\s*의견\s*[:：]')
_EXPERT_MARKER = re.compile(
    r'(?im)^(ai와\s*다른\s*전문가\s*의견|ai\s*의견에\s*추가한.*?전문가\s*의견)\s*[:：]'
)


# ── 파싱 ──────────────────────────────────────────────────────────────────────

def _split_into_blocks(text: str) -> list[dict]:
    """
    AI의견 마커를 구분자로 삼아 텍스트를 블록으로 분리.
    파일 내 여러 조항-교정 쌍을 개별 블록으로 반환.

    구조 (반복):
      [조항 원문]
      ai 의견 : [AI 의견]
      ai와 다른 전문가 의견 : [전문가 의견]   ← correction
      또는
      ai 의견에 추가한 전문가 의견 : [전문가 의견]  ← addition
    """
    ai_matches = list(_AI_MARKER.finditer(text))
    expert_matches = list(_EXPERT_MARKER.finditer(text))

    if not ai_matches:
        return []

    blocks = []
    expert_ptr = 0
    prev_expert_marker_end = 0

    for i, ai_match in enumerate(ai_matches):
        ai_start = ai_match.start()
        ai_content_start = ai_match.end()
        next_ai_start = ai_matches[i + 1].start() if i + 1 < len(ai_matches) else len(text)

        # 조항 텍스트: prev_expert_marker_end ~ ai_start 사이의 마지막 단락
        raw_before = text[prev_expert_marker_end:ai_start].strip()
        paragraphs = [p.strip() for p in re.split(r'\n\s*\n', raw_before) if p.strip()]
        clause_text = paragraphs[-1] if paragraphs else ""

        # 이번 AI마커 이후 ~ 다음 AI마커 이전 범위에서 전문가의견 마커 탐색
        expert_match = None
        while expert_ptr < len(expert_matches):
            em = expert_matches[expert_ptr]
            if ai_content_start <= em.start() < next_ai_start:
                expert_match = em
                expert_ptr += 1
                break
            if em.start() >= next_ai_start:
                break
            expert_ptr += 1

        if expert_match is None:
            prev_expert_marker_end = ai_content_start
            continue

        ai_opinion = text[ai_content_start:expert_match.start()].strip()

        # 전문가 의견: expert 마커 이후 ~ 다음 AI마커 사이
        # 다음 블록 조항이 끝에 섞일 수 있으므로 마지막 단락 제거
        raw_expert = text[expert_match.end():next_ai_start].strip()
        if i + 1 < len(ai_matches):
            ep = [p.strip() for p in re.split(r'\n\s*\n', raw_expert) if p.strip()]
            expert_opinion = "\n\n".join(ep[:-1]) if len(ep) > 1 else raw_expert
        else:
            expert_opinion = raw_expert

        correction_type = "correction" if "다른" in expert_match.group(1) else "addition"
        prev_expert_marker_end = expert_match.end()

        if clause_text and expert_opinion:
            blocks.append({
                "clause_text": clause_text,
                "ai_opinion": ai_opinion,
                "expert_opinion": expert_opinion,
                "correction_type": correction_type,
            })

    return blocks


def parse_correction_file(filepath: Path) -> list[dict]:
    """분析결과 txt 파일 → 조항-교정 쌍 목록"""
    text = filepath.read_text(encoding="utf-8")
    contract_type = filepath.stem.replace(" copy", "").strip()

    results = []
    for block in _split_into_blocks(text):
        clause_text = block["clause_text"].strip()
        expert_opinion = block["expert_opinion"].strip()
        if not clause_text or not expert_opinion:
            continue

        # 임베딩: 조항 텍스트를 앵커로, 전문가 의견 요약을 보조로
        embed_anchor = (
            f"계약 조항: {clause_text}\n"
            f"전문가 교정: {expert_opinion[:300]}"
        )

        results.append({
            "type": "expert_correction",
            "contract_type": contract_type,
            "clause_text": clause_text,
            "ai_opinion": block.get("ai_opinion", "").strip(),
            "expert_opinion": expert_opinion,
            "correction_type": block["correction_type"],
            "content": f"[계약 조항]\n{clause_text}\n\n[전문가 실무 의견]\n{expert_opinion}",
            "embed_anchor": embed_anchor,
            "summary": expert_opinion[:120],
            "source": "전문가 실무 검토",
        })

    return results


# ── 임베딩 ─────────────────────────────────────────────────────────────────────

def embed_dense(text: str, max_retries: int = 3) -> list[float]:
    for attempt in range(1, max_retries + 1):
        try:
            result = gemini_client.models.embed_content(
                model="gemini-embedding-2-preview",
                contents=text,
                config=types.EmbedContentConfig(task_type="RETRIEVAL_DOCUMENT"),
            )
            return result.embeddings[0].values
        except Exception as e:
            if attempt >= max_retries:
                raise
            wait = 4 * (2 ** attempt)
            print(f"임베딩 실패 ({attempt}/{max_retries}), {wait}초 대기: {e}")
            time.sleep(wait)


def embed_sparse(text: str) -> SparseVector:
    emb = next(iter(bm25_model.embed([text])))
    return SparseVector(indices=list(emb.indices), values=list(emb.values))


# ── MongoDB / Qdrant 저장 ──────────────────────────────────────────────────────

def make_unique_hash(doc: dict) -> str:
    raw = f"expert_correction|{doc.get('contract_type', '')}|{doc.get('clause_text', '')[:80]}"
    return hashlib.sha256(raw.encode("utf-8")).hexdigest()


def load_existing_hashes(db) -> set[str]:
    col = db[MONGO_COLLECTION]
    return {
        doc["unique_hash"]
        for doc in col.find({"type": "expert_correction"}, {"unique_hash": 1})
        if doc.get("unique_hash")
    }


def upsert_correction(db, qdrant_client, doc: dict, existing_hashes: set[str]) -> bool:
    unique_hash = make_unique_hash(doc)
    if unique_hash in existing_hashes:
        print(f"  중복 스킵: {doc.get('clause_text', '')[:40]}...")
        return False

    doc["unique_hash"] = unique_hash
    doc["process_status"] = "PENDING"

    col = db[MONGO_COLLECTION]
    mongo_id = col.insert_one(doc).inserted_id

    # 조항 중심 임베딩 텍스트 사용
    embed_text = doc.get("embed_anchor") or doc["content"]
    dense_vector = embed_dense(embed_text)
    sparse_vector = embed_sparse(embed_text)

    qdrant_id = objectid_to_uuid(mongo_id)
    qdrant_client.upsert(
        collection_name=LAW_COLLECTION,
        points=[
            PointStruct(
                id=qdrant_id,
                vector={
                    DENSE_VECTOR_NAME: dense_vector,
                    SPARSE_VECTOR_NAME: sparse_vector,
                },
                payload={
                    "mongo_id": str(mongo_id),
                    "type": "expert_correction",
                    "contract_type": doc.get("contract_type", ""),
                    "correction_type": doc.get("correction_type", ""),
                    "summary": doc.get("summary", ""),
                    "unique_hash": unique_hash,
                },
            )
        ],
    )

    col.update_one(
        {"_id": mongo_id},
        {"$set": {"process_status": "DONE", "qdrant_id": qdrant_id}},
    )

    existing_hashes.add(unique_hash)
    print(
        f"  저장: [{doc.get('correction_type')}] "
        f"{doc.get('contract_type', '')} / "
        f"{doc.get('clause_text', '')[:40]}..."
    )
    return True


# ── 진입점 ─────────────────────────────────────────────────────────────────────

def main():
    db = get_mongo_db()
    qdrant_client = get_qdrant()
    existing_hashes = load_existing_hashes(db)

    print(f"=== 전문가 교정 데이터 적재 시작 ===")
    print(f"기존 expert_correction 해시: {len(existing_hashes)}개")
    print(f"분析결과 디렉토리: {CORRECTIONS_DIR}\n")

    txt_files = list(CORRECTIONS_DIR.glob("*.txt"))
    if not txt_files:
        print(f"txt 파일 없음: {CORRECTIONS_DIR}")
        return

    total_inserted = 0
    for filepath in txt_files:
        print(f"[파일] {filepath.name}")
        docs = parse_correction_file(filepath)
        print(f"  파싱된 블록: {len(docs)}개")
        for doc in docs:
            if upsert_correction(db, qdrant_client, doc, existing_hashes):
                total_inserted += 1
                time.sleep(0.5)

    print(f"\n=== 완료: 총 {total_inserted}개 신규 저장 ===")


if __name__ == "__main__":
    main()
