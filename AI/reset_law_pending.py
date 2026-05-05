from rag.db_utils import get_mongo_db

db = get_mongo_db()
col = db["law_chunks"]

result = col.update_many(
    {
        "$or": [
            {"type": "law"},
            {
                "law_name": {"$exists": True},
                "article_num": {"$exists": True},
            }
        ]
    },
    {
        "$set": {
            "process_status": "PENDING",
            "type": "law"
        },
        "$unset": {
            "qdrant_id": ""
        }
    }
)

print(f"law 문서 PENDING 재설정 완료: {result.modified_count}개")