import os
import sys
from typing import Dict, List

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from dotenv import load_dotenv
from google import genai
from google.genai import types
from bson import ObjectId
from fastembed import SparseTextEmbedding
from qdrant_client import models

from rag.db_utils import get_mongo_db, get_qdrant, LAW_COLLECTION

load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if not GEMINI_API_KEY:
    raise RuntimeError("GEMINI_API_KEY가 설정되어 있지 않습니다.")

gemini_client = genai.Client(api_key=GEMINI_API_KEY)
bm25_model = SparseTextEmbedding(model_name="Qdrant/bm25")

DENSE_VECTOR_NAME = "dense"
SPARSE_VECTOR_NAME = "sparse"
DOC_CONTENT_MAX_CHARS = 90


def _embed_dense(text: str) -> list[float]:
    result = gemini_client.models.embed_content(
        model="gemini-embedding-2-preview",
        contents=text,
        config=types.EmbedContentConfig(task_type="RETRIEVAL_QUERY"),
    )
    return result.embeddings[0].values


def _embed_sparse(text: str) -> models.SparseVector:
    emb = next(iter(bm25_model.embed([text])))
    return models.SparseVector(indices=list(emb.indices), values=list(emb.values))


def _safe_trim(text: str, max_chars: int) -> str:
    value = (text or "").strip()
    if len(value) <= max_chars:
        return value
    return value[:max_chars].strip() + "..."


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
        "content": _safe_trim(
            payload.get("content")
            or doc.get("content")
            or payload.get("summary")
            or doc.get("summary", ""),
            DOC_CONTENT_MAX_CHARS,
        ),
        "source": payload.get("source") or doc.get("source", ""),
        "effective_date": payload.get("effective_date") or doc.get("effective_date", ""),
        "mongo_id": payload.get("mongo_id") or (str(doc.get("_id")) if doc.get("_id") else ""),
    }


def _sort_and_trim_docs(
    docs: List[Dict],
    rerank_top_n: int,
    min_score: float,
    top_k: int,
) -> List[Dict]:
    if not docs:
        return []

    ranked = sorted(docs, key=lambda x: x.get("score", 0), reverse=True)
    ranked = ranked[:rerank_top_n]

    filtered = [doc for doc in ranked if doc.get("score", 0) >= min_score]
    if filtered:
        return filtered[:top_k]

    return ranked[:top_k]


def search_legal_sources(
    query: str,
    top_k: int = 1,
    prefetch_limit: int = 4,
    rerank_top_n: int = 2,
    min_score: float = 0.25,
) -> Dict[str, List[Dict]]:
    dense_vector = _embed_dense(query)
    sparse_vector = _embed_sparse(query)

    qdrant = get_qdrant()
    db = get_mongo_db()
    col = db["law_chunks"]

    prefetch_count = max(prefetch_limit, top_k)

    results = qdrant.query_points(
        collection_name=LAW_COLLECTION,
        prefetch=[
            models.Prefetch(query=dense_vector, using=DENSE_VECTOR_NAME, limit=prefetch_count),
            models.Prefetch(query=sparse_vector, using=SPARSE_VECTOR_NAME, limit=prefetch_count),
        ],
        query=models.FusionQuery(fusion=models.Fusion.RRF),
        with_payload=True,
        limit=prefetch_count,
    )

    grouped = {
        "terms": [],
        "knowledge": [],
        "laws": [],
        "interpretations": [],
        "cases": [],
        "expert_corrections": [],
        "others": [],
    }

    mongo_ids = []
    for hit in results.points:
        payload = hit.payload or {}
        mongo_id = payload.get("mongo_id")
        if mongo_id:
            try:
                mongo_ids.append(ObjectId(mongo_id))
            except Exception:
                pass

    mongo_docs = {}
    if mongo_ids:
        for doc in col.find({"_id": {"$in": mongo_ids}}):
            mongo_docs[str(doc["_id"])] = doc

    for hit in results.points:
        payload = hit.payload or {}
        mongo_id = payload.get("mongo_id")
        mongo_doc = mongo_docs.get(mongo_id) if mongo_id else None

        doc = _normalize_payload(payload, mongo_doc, getattr(hit, "score", 0))
        doc_type = doc["type"]

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
        elif doc_type == "expert_correction":
            grouped["expert_corrections"].append(doc)
        else:
            grouped["others"].append(doc)

    for key in grouped:
        grouped[key] = _sort_and_trim_docs(
            grouped[key],
            rerank_top_n=rerank_top_n,
            min_score=min_score,
            top_k=top_k,
        )

    return grouped


def search_expert_corrections(query: str, top_k: int = 3, contract_type: str | None = None) -> list[dict]:
    """계약 조항과 유사한 전문가 교정 사례를 검색. contract_type 지정 시 해당 유형 우선 검색."""
    from qdrant_client import models as qdrant_models

    dense_vector = _embed_dense(query)
    sparse_vector = _embed_sparse(query)

    qdrant = get_qdrant()
    db = get_mongo_db()
    col = db["law_chunks"]

    type_condition = qdrant_models.FieldCondition(
        key="type",
        match=qdrant_models.MatchValue(value="expert_correction"),
    )

    def _query(extra_filter=None):
        must = [type_condition]
        if extra_filter:
            must.append(extra_filter)
        return qdrant.query_points(
            collection_name=LAW_COLLECTION,
            prefetch=[
                qdrant_models.Prefetch(query=dense_vector, using=DENSE_VECTOR_NAME, limit=top_k * 2),
                qdrant_models.Prefetch(query=sparse_vector, using=SPARSE_VECTOR_NAME, limit=top_k * 2),
            ],
            query=qdrant_models.FusionQuery(fusion=qdrant_models.Fusion.RRF),
            query_filter=qdrant_models.Filter(must=must),
            with_payload=True,
            limit=top_k * 2,
        )

    # 계약 유형 필터 적용 → 결과 없으면 전체 검색으로 폴백
    results = None
    if contract_type:
        results = _query(qdrant_models.FieldCondition(
            key="contract_type",
            match=qdrant_models.MatchText(text=contract_type),
        ))
    if not contract_type or not results.points:
        results = _query()

    mongo_ids = []
    for hit in results.points:
        mongo_id = (hit.payload or {}).get("mongo_id")
        if mongo_id:
            try:
                from bson import ObjectId
                mongo_ids.append(ObjectId(mongo_id))
            except Exception:
                pass

    mongo_docs = {}
    if mongo_ids:
        for doc in col.find({"_id": {"$in": mongo_ids}}):
            mongo_docs[str(doc["_id"])] = doc

    corrections = []
    for hit in results.points:
        payload = hit.payload or {}
        mongo_id = payload.get("mongo_id")
        mongo_doc = mongo_docs.get(mongo_id) if mongo_id else {}

        corrections.append({
            "score": getattr(hit, "score", 0),
            "contract_type": payload.get("contract_type") or (mongo_doc or {}).get("contract_type", ""),
            "correction_type": payload.get("correction_type") or (mongo_doc or {}).get("correction_type", ""),
            "clause_text": (mongo_doc or {}).get("clause_text", ""),
            "ai_opinion": (mongo_doc or {}).get("ai_opinion", ""),
            "expert_opinion": (mongo_doc or {}).get("expert_opinion", ""),
        })

    return corrections[:top_k]


def build_context_text(grouped: Dict[str, List[Dict]]) -> str:
    parts = []

    for section in [
        "terms",
        "knowledge",
        "laws",
        "interpretations",
        "cases",
        "expert_corrections",
        "others",
    ]:
        docs = grouped.get(section, [])
        for doc in docs[:1]:
            content = doc.get("content", "").strip()
            if content:
                parts.append(content)

    return "\n".join(parts)


def search_laws(query: str, top_k: int = 5) -> list[dict]:
    grouped = search_legal_sources(query, top_k=top_k)

    merged = []
    for doc in grouped["laws"] + grouped["others"]:
        merged.append({
            "lawName": doc.get("law_name", ""),
            "articleNum": doc.get("article", ""),
            "articleTitle": doc.get("title", ""),
            "content": doc.get("content", ""),
            "score": round(doc.get("score", 0), 4),
        })

    return merged
