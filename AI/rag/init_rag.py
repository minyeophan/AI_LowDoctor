"""
부동산 관련 법령을 법제처 API로 수집하여 MongoDB + Qdrant에 저장.
중단 시 재실행하면 PENDING 상태부터 이어서 진행.

실행 방법:
  docker-compose run ai python rag/init_rag.py
"""

import os
import sys
import time
import uuid
import requests
import xml.etree.ElementTree as ET
from datetime import date
from dotenv import load_dotenv
from google import genai
from google.genai import types
from qdrant_client.models import PointStruct, SparseVector
from fastembed import SparseTextEmbedding

bm25_model = SparseTextEmbedding(model_name="Qdrant/bm25")

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
load_dotenv()

from rag.db_utils import get_mongo_db, get_qdrant, ensure_qdrant_collection, objectid_to_uuid, LAW_COLLECTION

LAW_OC = os.getenv("LAW_OC")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

if not LAW_OC or not GEMINI_API_KEY:
    print("LAW_OC 또는 GEMINI_API_KEY가 설정되지 않았습니다.")
    sys.exit(1)

gemini_client = genai.Client(api_key=GEMINI_API_KEY)
BASE_URL = "https://www.law.go.kr/DRF"

# 부동산 계약 관련 법령 (민법은 618~654조만)
TARGET_LAWS = [
    {"name": "주택임대차보호법",    "mst": "276291",    "filter_articles": None},
    {"name": "주택임대차보호법 시행령",    "mst": "280995",     "filter_articles": None},

    {"name": "상가건물 임대차보호법",   "mst": "276285",    "filter_articles": None},
    {"name": "상가건물 임대차보호법 시행령",    "mst": "280987",    "filter_articles": None},

    {"name": "부동산 거래신고 등에 관한 법률",      "mst": "259641" ,    "filter_articles": None},
    {"name": "부동산 거래신고 등에 관한 법률 시행령",   "mst": "283653",    "filter_articles": None},
    {"name": "부동산 거래신고 등에 관한 법률 시행규칙",     "mst": "283339",  "filter_articles": None},

    {"name": "공인중개사법",    "mst": "273341" ,   "filter_articles": None},
    {"name": "공인중개사법 시행령",      "mst": "279243" ,    "filter_articles": None},
    {"name": "공인중개사법 시행규칙",      "mst": "263573" ,    "filter_articles": None},
    {"name": "공인중개사의 매수신청대리인 등록 등에 관한 규칙",      "mst": "244751" ,    "filter_articles": None},

    {"name": "집합건물의 소유 및 관리에 관한 법률",    "mst": "249285" ,   "filter_articles": None},
    {"name": "집합건물의 소유 및 관리에 관한 법률 시행령",    "mst": "254889" ,   "filter_articles": None},

    {"name": "전세사기피해자 지원 및 주거안정에 관한 특별법",    "mst": "277021" ,   "filter_articles": None},
    {"name": "전세사기피해자 지원 및 주거안정에 관한 특별법 시행령",    "mst": "266295" ,   "filter_articles": None},
    {"name": "전세사기피해자 지원 및 주거안정에 관한 특별법 시행규칙",    "mst": "273851" ,   "filter_articles": None},

    {"name": "부동산등기규칙",    "mst": "266847" ,   "filter_articles": None},
    {"name": "부동산등기법",    "mst": "265377" ,   "filter_articles": None},
    {"name": "축사의 부동산등기에 관한 특례법",    "mst": "210145" ,   "filter_articles": None},

    {"name": "민간임대주택에 관한 특별법",    "mst": "276995" ,   "filter_articles": None},
    {"name": "민간임대주택에 관한 특별법 시행령",    "mst": "269343" ,   "filter_articles": None},
    {"name": "민간임대주택에 관한 특별법 시행규칙",    "mst": "280639" ,   "filter_articles": None},

    {"name": "부도공공건설임대주택 임차인 보호를 위한 특별법",    "mst": "174491" ,   "filter_articles": None},
    {"name": "부도공공건설임대주택 임차인 보호를 위한 특별법 시행령",    "mst": "185425" ,   "filter_articles": None},

    {"name": "장기공공임대주택 입주자 삶의 질 향상 지원법",    "mst": "273421" ,   "filter_articles": None},
    {"name": "장기공공임대주택 입주자 삶의 질 향상 지원법 시행령",    "mst": "283499" ,   "filter_articles": None},
    {"name": "장기공공임대주택 입주자 삶의 질 향상 지원법 시행규칙",    "mst": "185553" ,   "filter_articles": None},

    {"name": "주택법",    "mst": "283191" ,   "filter_articles": None},
    {"name": "주택법 시행령",    "mst": "281851" ,   "filter_articles": None},
    {"name": "주택법 시행규칙",    "mst": "284551" ,   "filter_articles": None},

    {"name": "민법",    "mst": "284415" ,   "filter_articles": set(range(618, 655))},


]



def parse_article_text(article) -> str:
    """조문단위 XML 요소에서 항/호/목 계층 구조를 보존하여 텍스트 추출"""
    parts = []
    num = (article.findtext("조문번호") or "").strip()
    title = (article.findtext("조문제목") or "").strip()

    header = f"제{num}조"
    if title:
        header += f"({title})"
    parts.append(header)

    for hang in article.findall("항"):
        hang_num = (hang.findtext("항번호") or "").strip()
        hang_content = (hang.findtext("항내용") or "").strip()
        if hang_content:
            parts.append(f"{hang_num} {hang_content}")

        for ho in hang.findall("호"):
            ho_num = (ho.findtext("호번호") or "").strip()
            ho_content = (ho.findtext("호내용") or "").strip()
            if ho_content:
                parts.append(f"  {ho_num} {ho_content}")

            for mok in ho.findall("목"):
                mok_num = (mok.findtext("목번호") or "").strip()
                mok_content = (mok.findtext("목내용") or "").strip()
                if mok_content:
                    parts.append(f"    {mok_num} {mok_content}")

    return "\n".join(parts)


def fetch_law_articles(mst: str, law_name: str, filter_articles=None) -> list[dict]:
    """법제처 API: MST -> 조문 목록 파싱 (항/호/목 계층 보존)"""
    try:
        resp = requests.get(
            f"{BASE_URL}/lawService.do",
            params={"OC": LAW_OC, "target": "law", "MST": mst, "type": "XML"},
            timeout=30
        )
        root = ET.fromstring(resp.content)
    except Exception as e:
        print(f"법령 본문 조회 실패 ({law_name}): {e}")
        return []

    effective_date = (root.findtext(".//시행일자") or "").strip()
    revision_date = (root.findtext(".//공포일자") or "").strip()

    articles = []
    for article in root.findall(".//조문단위"):
        num_str = (article.findtext("조문번호") or "").strip()

        if filter_articles is not None:
            try:
                if int(num_str) not in filter_articles:
                    continue
            except ValueError:
                continue

        content = parse_article_text(article)
        if not content:
            continue

        articles.append({
            "law_name": law_name,
            "article_num": num_str,
            "article_title": (article.findtext("조문제목") or "").strip(),
            "content": content,
            "effective_date": effective_date,
            "revision_date": revision_date,
            "process_status": "PENDING",
        })

    return articles


def embed_text(text: str) -> list[float]:
    """Gemini gemini-embedding-2-preview로 임베딩 (저장용)"""
    result = gemini_client.models.embed_content(
        model="gemini-embedding-2-preview",
        contents=text,
        config=types.EmbedContentConfig(task_type="RETRIEVAL_DOCUMENT")
    )
    return result.embeddings[0].values


def step1_collect_laws(db):
    """Step 1: 법령 수집 -> MongoDB 저장 (이미 있으면 스킵)"""
    col = db["law_chunks"]
    print("\n[Step 1] 법령 수집 및 MongoDB 저장")

    for law_info in TARGET_LAWS:
        law_name = law_info["name"]
        filter_articles = law_info["filter_articles"]

        existing = col.count_documents({"law_name": law_name})
        if existing > 0:
            print(f"  {law_name}: 이미 {existing}개 저장됨, 스킵")
            continue

        print(f"  {law_name} 수집 중...")
        mst = law_info["mst"]

        articles = fetch_law_articles(mst, law_name, filter_articles)
        if not articles:
            print(f"  {law_name}: 수집된 조문 없음, 스킵")
            continue

        col.insert_many(articles)
        print(f"  {law_name}: {len(articles)}개 조문 저장 완료")
        time.sleep(1)


BATCH_SIZE = 20  # 한 번에 Qdrant에 저장할 개수


def step2_embed_and_store(db, qdrant):
    """Step 2: PENDING 항목만 임베딩 -> Qdrant 배치 저장 (이어쓰기 지원)"""
    col = db["law_chunks"]
    pending = list(col.find({"process_status": "PENDING"}))
    total = len(pending)

    if total == 0:
        print("\n[Step 2] 모든 항목이 이미 임베딩 완료되었습니다.")
        return

    print(f"\n[Step 2] 임베딩 시작: {total}개 항목 (배치 크기: {BATCH_SIZE})")

    batch_points = []   # Qdrant에 배치로 보낼 포인트 누적
    batch_ids = []      # MongoDB 상태 업데이트용 ID 누적

    for i, doc in enumerate(pending, 1):
        print(f"  [{i}/{total}] {doc['law_name']} 제{doc['article_num']}조 임베딩 중...")

        text = f"{doc['law_name']} {doc['content']}"

        retries = 0
        vector = None
        while retries < 3:
            try:
                vector = embed_text(text)
                break
            except Exception as e:
                retries += 1
                wait = 4 * (2 ** retries)
                print(f"  임베딩 실패 ({retries}/3), {wait}초 대기: {e}")
                time.sleep(wait)

        if vector is None:
            print(f"  최대 재시도 초과, 스킵: {doc['_id']}")
            continue

        qdrant_id = objectid_to_uuid(doc["_id"])
        sparse_result = list(bm25_model.embed([text]))[0]

        # 배치에 누적
        batch_points.append(
            PointStruct(
                id=qdrant_id,
                vector={
                    "dense": vector,
                    "sparse": SparseVector(
                        indices=sparse_result.indices.tolist(),
                        values=sparse_result.values.tolist()
                    )
                },
                payload={
                    "mongo_id": str(doc["_id"]),
                    "law_name": doc["law_name"],
                    "article_num": doc["article_num"],
                    "article_title": doc["article_title"],
                    "effective_date": doc["effective_date"],
                }
            )
        )
        batch_ids.append(doc["_id"])

        # 배치가 꽉 차거나 마지막 항목이면 Qdrant에 전송
        if len(batch_points) >= BATCH_SIZE or i == total:
            print(f"  → Qdrant 배치 저장 중 ({len(batch_points)}개)...")
            qdrant.upsert(collection_name=LAW_COLLECTION, points=batch_points)

            # MongoDB 상태 일괄 업데이트
            for doc_id in batch_ids:
                col.update_one(
                    {"_id": doc_id},
                    {"$set": {"process_status": "DONE"}}
                )

            batch_points = []
            batch_ids = []

        time.sleep(4)

    done = col.count_documents({"process_status": "DONE"})
    total_all = col.count_documents({})
    print(f"\n임베딩 완료: {done}개 / {total_all}개")


if __name__ == "__main__":
    print("=== RAG 초기화 시작 ===")
    print(f"실행일: {date.today()}")

    db = get_mongo_db()
    qdrant = get_qdrant()
    ensure_qdrant_collection(qdrant)

    step1_collect_laws(db)
    step2_embed_and_store(db, qdrant)

    print("\n=== RAG 초기화 완료 ===")
