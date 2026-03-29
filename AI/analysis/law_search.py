import os
import sys
<<<<<<< HEAD

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from dotenv import load_dotenv
from google import genai
from google.genai import types
from rag.db_utils import get_qdrant, LAW_COLLECTION
=======
from typing import Dict, List

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from dotenv import load_dotenv
from google import genai
from google.genai import types
from bson import ObjectId
from fastembed import SparseTextEmbedding
from qdrant_client import models

from rag.db_utils import get_mongo_db, get_qdrant, LAW_COLLECTION
>>>>>>> 993fa18 (feat: 챗봇 RAG 검색 및 법령/용어/지식베이스 연동 구현)

load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
<<<<<<< HEAD

=======
>>>>>>> 993fa18 (feat: 챗봇 RAG 검색 및 법령/용어/지식베이스 연동 구현)
if not GEMINI_API_KEY:
    raise RuntimeError("GEMINI_API_KEY가 설정되어 있지 않습니다.")

gemini_client = genai.Client(api_key=GEMINI_API_KEY)
<<<<<<< HEAD
=======
bm25_model = SparseTextEmbedding(model_name="Qdrant/bm25")

DENSE_VECTOR_NAME = "dense"
SPARSE_VECTOR_NAME = "sparse"
>>>>>>> 993fa18 (feat: 챗봇 RAG 검색 및 법령/용어/지식베이스 연동 구현)


def _embed_dense(text: str) -> list[float]:
    result = gemini_client.models.embed_content(
        model="gemini-embedding-2-preview",
        contents=text,
        config=types.EmbedContentConfig(task_type="RETRIEVAL_QUERY"),
    )
    return result.embeddings[0].values


<<<<<<< HEAD
def _normalize_hit(hit) -> dict:
    payload = hit.payload or {}
    return {
        "title": payload.get("title", ""),
        "law_name": payload.get("law_name", ""),
        "article": payload.get("article", ""),
        "summary": payload.get("summary", ""),
        "content": payload.get("content", ""),
        "source": payload.get("source", ""),
        "type": payload.get("type", "unknown"),
        "score": round(hit.score, 4),
    }


def search_legal_sources(query: str, top_k: int = 8) -> dict:
    vector = _embed(query)
=======
def _embed_sparse(text: str) -> models.SparseVector:
    emb = next(iter(bm25_model.embed([text])))
    return models.SparseVector(indices=list(emb.indices), values=list(emb.values))

>>>>>>> 993fa18 (feat: 챗봇 RAG 검색 및 법령/용어/지식베이스 연동 구현)

def _normalize_payload(hit_payload: dict, mongo_doc: dict | None, score: float) -> dict:
    payload = hit_payload or {}
    doc = mongo_doc or {}

    return {
        "score": score,
        "type": payload.get("type") or doc.get("type") or ("law" if payload.get("law_name") or doc.get("law_name") else "unknown"),
        "title": payload.get("title") or doc.get("title") or payload.get("article_title") or doc.get("article_title", ""),
        "law_name": payload.get("law_name") or doc.get("law_name", ""),
        "article": payload.get("article") or doc.get("article") or payload.get("article_num") or doc.get("article_num", ""),
        "summary": payload.get("summary") or doc.get("summary", ""),
        "content": payload.get("content") or doc.get("content", ""),
        "source": payload.get("source") or doc.get("source", ""),
        "effective_date": payload.get("effective_date") or doc.get("effective_date", ""),
        "mongo_id": payload.get("mongo_id") or (str(doc.get("_id")) if doc.get("_id") else ""),
    }


def search_legal_sources(query: str, top_k: int = 8) -> Dict[str, List[Dict]]:
    dense_vector = _embed_dense(query)
    sparse_vector = _embed_sparse(query)

    qdrant = get_qdrant()
    db = get_mongo_db()
    col = db["law_chunks"]

    results = qdrant.query_points(
        collection_name=LAW_COLLECTION,
        prefetch=[
            models.Prefetch(query=dense_vector, using=DENSE_VECTOR_NAME, limit=max(top_k * 3, 20)),
            models.Prefetch(query=sparse_vector, using=SPARSE_VECTOR_NAME, limit=max(top_k * 3, 20)),
        ],
        query=models.FusionQuery(fusion=models.Fusion.RRF),
        with_payload=True,
        limit=top_k,
    )

    grouped = {
        "terms": [],
        "knowledge": [],
        "laws": [],
        "interpretations": [],
        "cases": [],
        "others": [],
    }
<<<<<<< HEAD

    for hit in hits:
        doc = _normalize_hit(hit)
        doc_type = doc["type"]

=======

    for hit in results.points:
        payload = hit.payload or {}
        mongo_doc = None

        mongo_id = payload.get("mongo_id")
        if mongo_id:
            try:
                mongo_doc = col.find_one({"_id": ObjectId(mongo_id)})
            except Exception:
                mongo_doc = None

        doc = _normalize_payload(payload, mongo_doc, getattr(hit, "score", 0))
        doc_type = doc["type"]

>>>>>>> 993fa18 (feat: 챗봇 RAG 검색 및 법령/용어/지식베이스 연동 구현)
        if doc_type == "term":
            grouped["terms"].append(doc)
        elif doc_type == "knowledge":
            grouped["knowledge"].append(doc)
        elif doc_type == "law":
            grouped["laws"].append(doc)
        elif doc_type == "interpret":
            grouped["interpretations"].append(doc)
        elif doc_type == "case":
            grouped["cases"].append(doc)
        else:
            grouped["others"].append(doc)

    return grouped


<<<<<<< HEAD
def build_context_text(grouped: dict) -> str:
    def format_docs(title: str, docs: list[dict]) -> str:
=======
def build_context_text(grouped: Dict[str, List[Dict]]) -> str:
    def format_docs(title: str, docs: List[Dict]) -> str:
>>>>>>> 993fa18 (feat: 챗봇 RAG 검색 및 법령/용어/지식베이스 연동 구현)
        if not docs:
            return f"[{title}]\n없음\n"

        lines = [f"[{title}]"]
        for i, doc in enumerate(docs, start=1):
            lines.append(
                f"""({i})
<<<<<<< HEAD
제목: {doc.get("title", "")}
법령명: {doc.get("law_name", "")}
조문: {doc.get("article", "")}
요약: {doc.get("summary", "")}
내용: {doc.get("content", "")}
출처: {doc.get("source", "")}
유사도점수: {doc.get("score", 0)}"""
=======
제목: {doc.get('title', '')}
법령명: {doc.get('law_name', '')}
조문: {doc.get('article', '')}
요약: {doc.get('summary', '')}
내용: {doc.get('content', '')}
출처: {doc.get('source', '')}
유사도점수: {doc.get('score', 0)}"""
>>>>>>> 993fa18 (feat: 챗봇 RAG 검색 및 법령/용어/지식베이스 연동 구현)
            )
        lines.append("")
        return "\n".join(lines)

    return "\n".join([
        format_docs("법령용어", grouped["terms"]),
        format_docs("지식베이스", grouped["knowledge"]),
        format_docs("현행법령", grouped["laws"]),
        format_docs("법령해석", grouped["interpretations"]),
        format_docs("판례", grouped["cases"]),
        format_docs("기타", grouped["others"]),
    ])


<<<<<<< HEAD
# 기존 contract_analyzer.py와 호환용 함수
=======
>>>>>>> 993fa18 (feat: 챗봇 RAG 검색 및 법령/용어/지식베이스 연동 구현)
def search_laws(query: str, top_k: int = 5) -> list[dict]:
    grouped = search_legal_sources(query, top_k=top_k)

    merged = []
<<<<<<< HEAD

    for doc in grouped["laws"]:
=======
    for doc in grouped["laws"] + grouped["others"]:
>>>>>>> 993fa18 (feat: 챗봇 RAG 검색 및 법령/용어/지식베이스 연동 구현)
        merged.append({
            "lawName": doc.get("law_name", ""),
            "articleNum": doc.get("article", ""),
            "articleTitle": doc.get("title", ""),
            "content": doc.get("content", ""),
<<<<<<< HEAD
            "score": doc.get("score", 0),
=======
            "score": round(doc.get("score", 0), 4),
>>>>>>> 993fa18 (feat: 챗봇 RAG 검색 및 법령/용어/지식베이스 연동 구현)
        })

    return merged