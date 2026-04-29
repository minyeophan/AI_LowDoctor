from rag.db_utils import get_mongo_db

db = get_mongo_db()
col = db["law_chunks"]

result = col.update_many(
    {
        "law_name": {"$exists": True},
        "article_num": {"$exists": True},
        "$or": [
            {"type": {"$exists": False}},
            {"type": None},
            {"type": ""}
        ]
    },
    {
        "$set": {"type": "law"}
    }
)

print(f"type=law 보정 완료: {result.modified_count}개")