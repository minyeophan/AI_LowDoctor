import os
import sys
import json
import hashlib
import requests
from dotenv import load_dotenv
from google import genai
from google.genai import types
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
qdrant = get_qdrant()

TERM_API_URL = "https://www.law.go.kr/DRF/lawSearch.do"
KNOWLEDGE_API_URL = "https://www.law.go.kr/DRF/lawSearch.do"

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
        for key, value in data.items():
            if isinstance(value, list):
                print(f"응답에서 '{key}' 리스트를 찾았습니다. 개수: {len(value)}")
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

    return existing_hashes


def upsert_docs(docs: list[dict], doc_type: str, start_id: int, existing_hashes: set[str]):
    if not docs:
        print(f"{doc_type} 데이터가 없습니다.")
        return start_id, 0

    current_id = start_id
    inserted_count = 0
    skipped_count = 0

    for idx, doc in enumerate(docs, start=1):
        try:
            doc["type"] = doc_type
            unique_hash = make_unique_hash(doc)

            if unique_hash in existing_hashes:
                skipped_count += 1
                print(f"{doc_type} 중복 건너뜀: title={doc.get('title', '')}")
                continue

            doc["unique_hash"] = unique_hash

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
            )

            existing_hashes.add(unique_hash)
            inserted_count += 1

            print(f"{doc_type} 저장 완료: id={current_id}, title={doc.get('title', '')}")
            current_id += 1

        except Exception as e:
            print(f"{doc_type} 업로드 실패 ({idx}번째): {e}")

    print(f"{doc_type} 업로드 완료: 신규 {inserted_count}개, 중복 스킵 {skipped_count}개")
    return current_id, inserted_count


def fetch_term_page(query: str, page: int) -> list[dict]:
    params = {
        "OC": LAW_OC,
        "target": "lstrmAI",
        "type": "JSON",
        "query": query,
        "display": 20,
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
        "display": 20,
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


def process_term(progress, start_id, existing_hashes):
    query_index = progress["term"]["query_index"]
    page = progress["term"]["page"]
    current_id = start_id

    for qi in range(query_index, len(TERM_QUERIES)):
        query = TERM_QUERIES[qi]
        current_page = page if qi == query_index else 1

        while True:
            docs = fetch_term_page(query, current_page)
            if not docs:
                break

            current_id, inserted_count = upsert_docs(docs, "term", current_id, existing_hashes)

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

    return current_id


def process_knowledge(progress, start_id, existing_hashes):
    query_index = progress["knowledge"]["query_index"]
    page = progress["knowledge"]["page"]
    current_id = start_id

    for qi in range(query_index, len(KNOWLEDGE_QUERIES)):
        query = KNOWLEDGE_QUERIES[qi]
        current_page = page if qi == query_index else 1

        while True:
            docs = fetch_knowledge_page(query, current_page)
            if not docs:
                break

            current_id, inserted_count = upsert_docs(docs, "knowledge", current_id, existing_hashes)

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


if __name__ == "__main__":
    main()