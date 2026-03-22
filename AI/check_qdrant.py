import os
from collections import Counter
from dotenv import load_dotenv
from qdrant_client import QdrantClient

load_dotenv()

QDRANT_URL = os.getenv("QDRANT_URL", "http://localhost:6333")
QDRANT_API_KEY = os.getenv("QDRANT_API_KEY", "")
COLLECTION_NAME = "law_chunks"

if QDRANT_API_KEY:
    client = QdrantClient(url=QDRANT_URL, api_key=QDRANT_API_KEY)
else:
    client = QdrantClient(url=QDRANT_URL)

def main():
    try:
        info = client.get_collection(COLLECTION_NAME)
        print("=== 컬렉션 정보 ===")
        print(info)

        count_result = client.count(collection_name=COLLECTION_NAME, exact=True)
        print(f"\n=== 총 저장된 데이터 개수 ===\n{count_result.count}")

        all_points = []
        next_page_offset = None

        while True:
            points, next_page_offset = client.scroll(
                collection_name=COLLECTION_NAME,
                limit=100,
                offset=next_page_offset,
                with_payload=True,
                with_vectors=False,
            )
            all_points.extend(points)

            if next_page_offset is None:
                break

        print(f"\n=== 실제 읽어온 데이터 개수 ===\n{len(all_points)}")

        type_counter = Counter()
        for point in all_points:
            payload = point.payload or {}
            doc_type = payload.get("type", "unknown")
            type_counter[doc_type] += 1

        print("\n=== type별 개수 ===")
        for doc_type, count in type_counter.items():
            print(f"{doc_type}: {count}개")

        print("\n=== law 샘플 ===")
        law_sample = next((p for p in all_points if (p.payload or {}).get("type") == "law"), None)
        if law_sample:
            print(law_sample.payload)
        else:
            print("law 데이터 없음")

        print("\n=== term 샘플 ===")
        term_sample = next((p for p in all_points if (p.payload or {}).get("type") == "term"), None)
        if term_sample:
            print(term_sample.payload)
        else:
            print("term 데이터 없음")

        print("\n=== knowledge 샘플 ===")
        knowledge_sample = next((p for p in all_points if (p.payload or {}).get("type") == "knowledge"), None)
        if knowledge_sample:
            print(knowledge_sample.payload)
        else:
            print("knowledge 데이터 없음")

    except Exception as e:
        print("Qdrant 확인 중 오류 발생:", e)

if __name__ == "__main__":
    main()