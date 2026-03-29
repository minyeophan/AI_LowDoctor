import os
import sys
import json
<<<<<<< HEAD
=======
import time
>>>>>>> 993fa18 (feat: 챗봇 RAG 검색 및 법령/용어/지식베이스 연동 구현)
import hashlib
import requests
from dotenv import load_dotenv
from google import genai
from google.genai import types
<<<<<<< HEAD
from qdrant_client.models import PointStruct

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from rag.db_utils import get_qdrant, LAW_COLLECTION

load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
LAW_OC = os.getenv("LAW_OC")

if not GEMINI_API_KEY:
    raise RuntimeError("GEMINI_API_KEY가 .env에 설정되어 있지 않습니다.")

if not LAW_OC:
    raise RuntimeError("LAW_OC가 .env에 설정되어 있지 않습니다.")

gemini_client = genai.Client(api_key=GEMINI_API_KEY)
=======
from fastembed import SparseTextEmbedding
from qdrant_client.models import PointStruct, SparseVector

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
load_dotenv()

from rag.db_utils import get_mongo_db, get_qdrant, LAW_COLLECTION, objectid_to_uuid

LAW_OC = os.getenv("LAW_OC")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

if not LAW_OC or not GEMINI_API_KEY:
    raise RuntimeError("LAW_OC 또는 GEMINI_API_KEY가 설정되어 있지 않습니다.")

gemini_client = genai.Client(api_key=GEMINI_API_KEY)
bm25_model = SparseTextEmbedding(model_name="Qdrant/bm25")

mongo_db = get_mongo_db()
>>>>>>> 993fa18 (feat: 챗봇 RAG 검색 및 법령/용어/지식베이스 연동 구현)
qdrant = get_qdrant()

TERM_API_URL = "https://www.law.go.kr/DRF/lawSearch.do"
KNOWLEDGE_API_URL = "https://www.law.go.kr/DRF/lawSearch.do"
<<<<<<< HEAD

PROGRESS_FILE = os.path.join(os.path.dirname(__file__), "..", "data", "upsert_progress.json")

TERM_QUERIES = [
    "임대인",
    "임차인",
    "묵시적 갱신",
    "계약갱신요구권",
    "보증금",
    "전대차",
    "위약금",
]

KNOWLEDGE_QUERIES = [
    "임대차",
    "보증금",
    "계약갱신요구권",
    "전대차",
    "묵시적 갱신",
    "위약금",
=======
MONGO_COLLECTION = "law_chunks"

PROGRESS_FILE = os.path.join(os.path.dirname(__file__), "..", "data", "upsert_progress.json")

DENSE_VECTOR_NAME = "dense"
SPARSE_VECTOR_NAME = "sparse"

TERM_QUERIES = [
    "임대인", "임차인", "임대차", "보증금", "전세금", "차임", "월세", "전대차", "전차인",
    "전세권", "묵시적 갱신", "계약갱신요구권", "계약 해지", "해지 통보", "손해배상",
    "위약금", "해약금", "원상회복", "원상복구", "주택임대차보호법", "상가건물 임대차보호법",
    "대항력", "우선변제권", "확정일자", "최우선변제", "전세사기", "임대보증금", "보증금 반환",
    "임차권등기명령", "관리비", "중개수수료", "공인중개사", "특약", "계약기간", "갱신거절", "전입신고",
]

KNOWLEDGE_QUERIES = [
    "임대차", "주택임대차", "상가임대차", "주택임대차보호법", "상가건물 임대차보호법", "보증금",
    "보증금 반환", "임대보증금", "전세금", "월세", "차임", "계약갱신요구권", "묵시적 갱신",
    "갱신거절", "계약 해지", "해지 통보", "손해배상", "위약금", "해약금", "전대차", "전차인",
    "전세권", "대항력", "우선변제권", "확정일자", "최우선변제", "임차권등기명령", "원상회복",
    "원상복구", "관리비", "중개수수료", "전입신고", "특약", "계약기간", "전세사기", "임대차 분쟁",
>>>>>>> 993fa18 (feat: 챗봇 RAG 검색 및 법령/용어/지식베이스 연동 구현)
]


def load_progress():
    if not os.path.exists(PROGRESS_FILE):
        return {
            "term": {"query_index": 0, "page": 1},
            "knowledge": {"query_index": 0, "page": 1},
        }

    with open(PROGRESS_FILE, "r", encoding="utf-8") as f:
        return json.load(f)


def save_progress(progress):
    os.makedirs(os.path.dirname(PROGRESS_FILE), exist_ok=True)
    with open(PROGRESS_FILE, "w", encoding="utf-8") as f:
        json.dump(progress, f, ensure_ascii=False, indent=2)


<<<<<<< HEAD
def embed_text(text: str) -> list[float]:
    result = gemini_client.models.embed_content(
        model="gemini-embedding-2-preview",
        contents=text,
        config=types.EmbedContentConfig(task_type="RETRIEVAL_DOCUMENT"),
    )
    return result.embeddings[0].values


def get_start_id() -> int:
    count_result = qdrant.count(collection_name=LAW_COLLECTION, exact=True)
    return count_result.count + 1
=======
def embed_dense(text: str, max_retries: int = 3) -> list[float]:
    retry = 0
    while True:
        try:
            result = gemini_client.models.embed_content(
                model="gemini-embedding-2-preview",
                contents=text,
                config=types.EmbedContentConfig(task_type="RETRIEVAL_DOCUMENT"),
            )
            return result.embeddings[0].values
        except Exception as e:
            retry += 1
            print(f"임베딩 실패 ({retry}회): {e}")

            if "429" in str(e) or "RESOURCE_EXHAUSTED" in str(e):
                wait_sec = min(30 * retry, 120)
                print(f"임베딩 quota/rate 제한으로 {wait_sec}초 대기 후 재시도")
                time.sleep(wait_sec)
            else:
                if retry >= max_retries:
                    raise
                time.sleep(3)

            if retry >= max_retries:
                raise


def embed_sparse(text: str) -> SparseVector:
    emb = next(iter(bm25_model.embed([text])))
    return SparseVector(
        indices=list(emb.indices),
        values=list(emb.values),
    )
>>>>>>> 993fa18 (feat: 챗봇 RAG 검색 및 법령/용어/지식베이스 연동 구현)


def make_embedding_input(doc: dict, doc_type: str) -> str:
    return f"""
유형: {doc_type}
제목: {doc.get("title", "")}
법령명: {doc.get("law_name", "")}
조문: {doc.get("article", "")}
요약: {doc.get("summary", "")}
내용: {doc.get("content", "")}
출처: {doc.get("source", "")}
""".strip()


def extract_items_from_json(data):
    if isinstance(data, list):
        return data

    if isinstance(data, dict):
<<<<<<< HEAD
        for key, value in data.items():
            if isinstance(value, list):
                print(f"응답에서 '{key}' 리스트를 찾았습니다. 개수: {len(value)}")
=======
        for _, value in data.items():
            if isinstance(value, list):
>>>>>>> 993fa18 (feat: 챗봇 RAG 검색 및 법령/용어/지식베이스 연동 구현)
                return value
            elif isinstance(value, dict):
                result = extract_items_from_json(value)
                if result:
                    return result

    return []


def make_unique_key(doc: dict) -> str:
    raw = f"{doc.get('type', '')}|{doc.get('title', '')}|{doc.get('law_name', '')}|{doc.get('article', '')}"
    return raw.strip()


def make_unique_hash(doc: dict) -> str:
    key = make_unique_key(doc)
    return hashlib.sha256(key.encode("utf-8")).hexdigest()


<<<<<<< HEAD
def load_existing_hashes() -> set[str]:
    existing_hashes = set()
    next_page_offset = None

    while True:
        points, next_page_offset = qdrant.scroll(
            collection_name=LAW_COLLECTION,
            limit=200,
            offset=next_page_offset,
            with_payload=True,
            with_vectors=False,
        )

        for point in points:
            payload = point.payload or {}

            unique_hash = payload.get("unique_hash")
            if unique_hash:
                existing_hashes.add(unique_hash)
                continue

            if any(k in payload for k in ["type", "title", "law_name", "article"]):
                computed_hash = make_unique_hash(payload)
                existing_hashes.add(computed_hash)

        if next_page_offset is None:
            break
=======
def load_existing_hashes_from_mongo() -> set[str]:
    col = mongo_db[MONGO_COLLECTION]
    existing_hashes = set()

    for doc in col.find(
        {"type": {"$in": ["term", "knowledge"]}},
        {"unique_hash": 1, "type": 1, "title": 1, "law_name": 1, "article": 1},
    ):
        if doc.get("unique_hash"):
            existing_hashes.add(doc["unique_hash"])
            continue

        normalized = {
            "type": doc.get("type", ""),
            "title": doc.get("title", ""),
            "law_name": doc.get("law_name", ""),
            "article": doc.get("article", ""),
        }
        existing_hashes.add(make_unique_hash(normalized))
>>>>>>> 993fa18 (feat: 챗봇 RAG 검색 및 법령/용어/지식베이스 연동 구현)

    return existing_hashes


<<<<<<< HEAD
def upsert_docs(docs: list[dict], doc_type: str, start_id: int, existing_hashes: set[str]):
    if not docs:
        print(f"{doc_type} 데이터가 없습니다.")
        return start_id, 0

    current_id = start_id
    inserted_count = 0
    skipped_count = 0
=======
def insert_doc_to_mongo(doc: dict):
    return mongo_db[MONGO_COLLECTION].insert_one(doc).inserted_id


def upsert_doc_to_qdrant(mongo_id, doc: dict, dense_vector: list[float], sparse_vector: SparseVector):
    qdrant_id = objectid_to_uuid(mongo_id)

    qdrant.upsert(
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
                    "type": doc.get("type", ""),
                    "title": doc.get("title", ""),
                    "law_name": doc.get("law_name", ""),
                    "article": doc.get("article", ""),
                    "summary": doc.get("summary", ""),
                    "source": doc.get("source", ""),
                    "unique_hash": doc.get("unique_hash", ""),
                },
            )
        ],
    )

    return qdrant_id


def save_docs_to_mongo_and_qdrant(docs: list[dict], doc_type: str, existing_hashes: set[str]) -> int:
    if not docs:
        print(f"{doc_type} 데이터가 없습니다.")
        return 0

    inserted_count = 0
    skipped_count = 0
    col = mongo_db[MONGO_COLLECTION]
>>>>>>> 993fa18 (feat: 챗봇 RAG 검색 및 법령/용어/지식베이스 연동 구현)

    for idx, doc in enumerate(docs, start=1):
        try:
            doc["type"] = doc_type
            unique_hash = make_unique_hash(doc)

            if unique_hash in existing_hashes:
                skipped_count += 1
                print(f"{doc_type} 중복 건너뜀: title={doc.get('title', '')}")
                continue

            doc["unique_hash"] = unique_hash
<<<<<<< HEAD

            text = make_embedding_input(doc, doc_type)
            vector = embed_text(text)

            qdrant.upsert(
                collection_name=LAW_COLLECTION,
                points=[
                    PointStruct(
                        id=current_id,
                        vector=vector,
                        payload=doc,
                    )
                ],
=======
            doc["process_status"] = "PENDING"

            mongo_id = insert_doc_to_mongo(doc)

            text = make_embedding_input(doc, doc_type)
            dense_vector = embed_dense(text)
            sparse_vector = embed_sparse(text)

            qdrant_id = upsert_doc_to_qdrant(mongo_id, doc, dense_vector, sparse_vector)

            col.update_one(
                {"_id": mongo_id},
                {"$set": {"process_status": "DONE", "qdrant_id": qdrant_id}},
>>>>>>> 993fa18 (feat: 챗봇 RAG 검색 및 법령/용어/지식베이스 연동 구현)
            )

            existing_hashes.add(unique_hash)
            inserted_count += 1

<<<<<<< HEAD
            print(f"{doc_type} 저장 완료: id={current_id}, title={doc.get('title', '')}")
            current_id += 1
=======
            print(f"{doc_type} 저장 완료: mongo_id={mongo_id}, qdrant_id={qdrant_id}, title={doc.get('title', '')}")
>>>>>>> 993fa18 (feat: 챗봇 RAG 검색 및 법령/용어/지식베이스 연동 구현)

        except Exception as e:
            print(f"{doc_type} 업로드 실패 ({idx}번째): {e}")

    print(f"{doc_type} 업로드 완료: 신규 {inserted_count}개, 중복 스킵 {skipped_count}개")
<<<<<<< HEAD
    return current_id, inserted_count
=======
    return inserted_count
>>>>>>> 993fa18 (feat: 챗봇 RAG 검색 및 법령/용어/지식베이스 연동 구현)


def fetch_term_page(query: str, page: int) -> list[dict]:
    params = {
        "OC": LAW_OC,
        "target": "lstrmAI",
        "type": "JSON",
        "query": query,
<<<<<<< HEAD
        "display": 20,
=======
        "display": 100,
>>>>>>> 993fa18 (feat: 챗봇 RAG 검색 및 법령/용어/지식베이스 연동 구현)
        "page": page,
    }

    response = requests.get(TERM_API_URL, params=params, timeout=30)
    response.raise_for_status()
    data = response.json()

    items = extract_items_from_json(data)

    docs = []
    for item in items:
        docs.append({
            "type": "term",
            "title": item.get("법령용어명", "") or item.get("용어명", "") or item.get("title", "") or item.get("wordName", ""),
            "law_name": item.get("법령명", "") or item.get("law_name", "") or item.get("lawTitle", ""),
            "article": item.get("조문번호", "") or item.get("article", "") or item.get("articleNum", ""),
            "summary": item.get("설명", "") or item.get("정의", "") or item.get("wordMeaning", "") or item.get("summary", ""),
            "content": item.get("설명", "") or item.get("정의", "") or item.get("wordMeaning", "") or item.get("content", ""),
            "source": "법령용어",
        })

    print(f"[term] query='{query}' page={page} -> {len(docs)}개")
    return docs


def fetch_knowledge_page(query: str, page: int) -> list[dict]:
    params = {
        "OC": LAW_OC,
        "target": "aiSearch",
        "type": "JSON",
        "search": 0,
        "query": query,
<<<<<<< HEAD
        "display": 20,
=======
        "display": 100,
>>>>>>> 993fa18 (feat: 챗봇 RAG 검색 및 법령/용어/지식베이스 연동 구현)
        "page": page,
    }

    response = requests.get(KNOWLEDGE_API_URL, params=params, timeout=30)
    response.raise_for_status()
    data = response.json()

    items = extract_items_from_json(data)

    docs = []
    for item in items:
        docs.append({
            "type": "knowledge",
            "title": item.get("조문제목", "") or item.get("법령명", "") or item.get("title", "") or item.get("subject", "") or item.get("제목", ""),
            "law_name": item.get("법령명", "") or item.get("law_name", "") or item.get("lawTitle", ""),
            "article": item.get("조문번호", "") or item.get("article", "") or item.get("articleNum", ""),
            "summary": (item.get("조문내용", "") or item.get("description", "") or item.get("summary", "") or item.get("설명", ""))[:120],
            "content": item.get("조문내용", "") or item.get("description", "") or item.get("content", "") or item.get("설명", ""),
            "source": "지능형 법령정보지식베이스",
        })

    print(f"[knowledge] query='{query}' page={page} -> {len(docs)}개")
    return docs


<<<<<<< HEAD
def process_term(progress, start_id, existing_hashes):
    query_index = progress["term"]["query_index"]
    page = progress["term"]["page"]
    current_id = start_id
=======
def process_term(progress, existing_hashes):
    query_index = progress["term"]["query_index"]
    page = progress["term"]["page"]
>>>>>>> 993fa18 (feat: 챗봇 RAG 검색 및 법령/용어/지식베이스 연동 구현)

    for qi in range(query_index, len(TERM_QUERIES)):
        query = TERM_QUERIES[qi]
        current_page = page if qi == query_index else 1

        while True:
            docs = fetch_term_page(query, current_page)
            if not docs:
                break

<<<<<<< HEAD
            current_id, inserted_count = upsert_docs(docs, "term", current_id, existing_hashes)
=======
            inserted_count = save_docs_to_mongo_and_qdrant(docs, "term", existing_hashes)
>>>>>>> 993fa18 (feat: 챗봇 RAG 검색 및 법령/용어/지식베이스 연동 구현)

            progress["term"]["query_index"] = qi
            progress["term"]["page"] = current_page + 1
            save_progress(progress)

            if inserted_count == 0:
                print(f"[term] query='{query}' page={current_page} 에서 신규 저장 0개 -> 다음 query로 이동")
                break

            current_page += 1

        progress["term"]["query_index"] = qi + 1
        progress["term"]["page"] = 1
        save_progress(progress)

<<<<<<< HEAD
    return current_id


def process_knowledge(progress, start_id, existing_hashes):
    query_index = progress["knowledge"]["query_index"]
    page = progress["knowledge"]["page"]
    current_id = start_id
=======

def process_knowledge(progress, existing_hashes):
    query_index = progress["knowledge"]["query_index"]
    page = progress["knowledge"]["page"]
>>>>>>> 993fa18 (feat: 챗봇 RAG 검색 및 법령/용어/지식베이스 연동 구현)

    for qi in range(query_index, len(KNOWLEDGE_QUERIES)):
        query = KNOWLEDGE_QUERIES[qi]
        current_page = page if qi == query_index else 1

        while True:
            docs = fetch_knowledge_page(query, current_page)
            if not docs:
                break

<<<<<<< HEAD
            current_id, inserted_count = upsert_docs(docs, "knowledge", current_id, existing_hashes)
=======
            inserted_count = save_docs_to_mongo_and_qdrant(docs, "knowledge", existing_hashes)
>>>>>>> 993fa18 (feat: 챗봇 RAG 검색 및 법령/용어/지식베이스 연동 구현)

            progress["knowledge"]["query_index"] = qi
            progress["knowledge"]["page"] = current_page + 1
            save_progress(progress)

            if inserted_count == 0:
                print(f"[knowledge] query='{query}' page={current_page} 에서 신규 저장 0개 -> 다음 query로 이동")
                break

            current_page += 1

        progress["knowledge"]["query_index"] = qi + 1
        progress["knowledge"]["page"] = 1
        save_progress(progress)

<<<<<<< HEAD
    return current_id


def main():
    progress = load_progress()
    start_id = get_start_id()
    existing_hashes = load_existing_hashes()

    print("=== 현재 진행 상태 ===")
    print(json.dumps(progress, ensure_ascii=False, indent=2))
    print(f"\n=== 기존 중복 해시 개수 ===\n{len(existing_hashes)}")

    print("\n법령용어(term) 적재 시작")
    next_id = process_term(progress, start_id, existing_hashes)

    print("\n지식베이스(knowledge) 적재 시작")
    process_knowledge(progress, next_id, existing_hashes)

    print("\n법령용어 + 지식베이스 적재 완료")
=======

def main():
    progress = load_progress()
    existing_hashes = load_existing_hashes_from_mongo()

    print("=== 현재 진행 상태 ===")
    print(json.dumps(progress, ensure_ascii=False, indent=2))
    print(f"\n=== 기존 MongoDB 중복 해시 개수 ===\n{len(existing_hashes)}")

    print("\n법령용어(term) 적재 시작")
    process_term(progress, existing_hashes)

    print("\n지식베이스(knowledge) 적재 시작")
    process_knowledge(progress, existing_hashes)

    print("\n법령용어 + 지식베이스 MongoDB + Qdrant 적재 완료")
>>>>>>> 993fa18 (feat: 챗봇 RAG 검색 및 법령/용어/지식베이스 연동 구현)


if __name__ == "__main__":
    main()