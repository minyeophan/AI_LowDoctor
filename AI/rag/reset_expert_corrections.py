"""
expert_correction 데이터를 MongoDB + Qdrant에서 모두 삭제한 뒤 재적재.

실행:
  docker-compose run ai python rag/reset_expert_corrections.py
"""

import os
import sys

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
from dotenv import load_dotenv
load_dotenv()

from qdrant_client.models import PointIdsList
from rag.db_utils import get_mongo_db, get_qdrant, LAW_COLLECTION


def delete_existing_corrections() -> int:
    db = get_mongo_db()
    qdrant_client = get_qdrant()
    col = db["law_chunks"]

    docs = list(col.find({"type": "expert_correction"}, {"_id": 1, "qdrant_id": 1}))
    print(f"삭제 대상: MongoDB {len(docs)}개")

    qdrant_ids = [doc["qdrant_id"] for doc in docs if doc.get("qdrant_id")]
    if qdrant_ids:
        qdrant_client.delete(
            collection_name=LAW_COLLECTION,
            points_selector=PointIdsList(points=qdrant_ids),
        )
        print(f"Qdrant에서 {len(qdrant_ids)}개 삭제 완료")

    result = col.delete_many({"type": "expert_correction"})
    print(f"MongoDB에서 {result.deleted_count}개 삭제 완료")
    return result.deleted_count


def main():
    print("=== expert_correction 데이터 초기화 ===")
    deleted = delete_existing_corrections()
    print(f"총 {deleted}개 삭제됨\n")

    print("=== 재적재 시작 ===")
    from rag.upsert_expert_corrections import main as upsert_main
    upsert_main()


if __name__ == "__main__":
    main()
