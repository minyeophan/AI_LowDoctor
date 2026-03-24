import os
import sys

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from dotenv import load_dotenv
from google import genai
from google.genai import types
from rag.db_utils import get_qdrant, LAW_COLLECTION

load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

if not GEMINI_API_KEY:
    raise RuntimeError("GEMINI_API_KEY가 설정되어 있지 않습니다.")

gemini_client = genai.Client(api_key=GEMINI_API_KEY)


def _embed(text: str) -> list[float]:
    result = gemini_client.models.embed_content(
        model="gemini-embedding-2-preview",
        contents=text,
        config=types.EmbedContentConfig(task_type="RETRIEVAL_QUERY")
    )
    return result.embeddings[0].values


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

    hits = get_qdrant().query_points(
        collection_name=LAW_COLLECTION,
        query=vector,
        limit=top_k
    ).points

    grouped = {
        "terms": [],
        "knowledge": [],
        "laws": [],
        "interpretations": [],
        "cases": [],
        "others": [],
    }

    for hit in hits:
        doc = _normalize_hit(hit)
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
        else:
            grouped["others"].append(doc)

    return grouped


def build_context_text(grouped: dict) -> str:
    def format_docs(title: str, docs: list[dict]) -> str:
        if not docs:
            return f"[{title}]\n없음\n"

        lines = [f"[{title}]"]
        for i, doc in enumerate(docs, start=1):
            lines.append(
                f"""({i})
제목: {doc.get("title", "")}
법령명: {doc.get("law_name", "")}
조문: {doc.get("article", "")}
요약: {doc.get("summary", "")}
내용: {doc.get("content", "")}
출처: {doc.get("source", "")}
유사도점수: {doc.get("score", 0)}"""
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


# 기존 contract_analyzer.py와 호환용 함수
def search_laws(query: str, top_k: int = 5) -> list[dict]:
    grouped = search_legal_sources(query, top_k=top_k)

    merged = []

    for doc in grouped["laws"]:
        merged.append({
            "lawName": doc.get("law_name", ""),
            "articleNum": doc.get("article", ""),
            "articleTitle": doc.get("title", ""),
            "content": doc.get("content", ""),
            "score": doc.get("score", 0),
        })

    return merged