import os
import sys
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from google import genai
from google.genai import types
from dotenv import load_dotenv
from bson import ObjectId
from rag.db_utils import get_mongo_db, get_qdrant, LAW_COLLECTION

load_dotenv()

gemini_client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))


def _embed(text: str) -> list[float]:
    result = gemini_client.models.embed_content(
        model="gemini-embedding-2-preview",
        contents=text,
        config=types.EmbedContentConfig(task_type="RETRIEVAL_QUERY")
    )
    return result.embeddings[0].values


def search_laws(query: str, top_k: int = 5) -> list[dict]:
    """
    계약서 텍스트(또는 위험 조항)를 받아 관련 법령 조문을 검색.

    반환 예시:
    [
      {
        "lawName": "주택임대차보호법",
        "articleNum": "3",
        "articleTitle": "대항력 등",
        "content": "제3조(대항력 등) ...",
        "score": 0.91
      },
      ...
    ]
    """
    vector = _embed(query)

    hits = get_qdrant().query_points(
        collection_name=LAW_COLLECTION,
        query=vector,
        limit=top_k
    ).points

    if not hits:
        return []

    col = get_mongo_db()["law_chunks"]
    results = []

    for hit in hits:
        mongo_id = hit.payload.get("mongo_id")
        doc = col.find_one({"_id": ObjectId(mongo_id)})
        if doc:
            results.append({
                "lawName": doc["law_name"],
                "articleNum": doc["article_num"],
                "articleTitle": doc.get("article_title", ""),
                "content": doc["content"],
                "score": round(hit.score, 4),
            })

    return results
