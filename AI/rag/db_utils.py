import os
import uuid
from pymongo import MongoClient
from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams
from dotenv import load_dotenv

load_dotenv()

MONGO_URL = os.getenv("MONGO_URL")
QDRANT_URL = os.getenv("QDRANT_URL")
QDRANT_API_KEY = os.getenv("QDRANT_API_KEY")

LAW_COLLECTION = "law_chunks"
VECTOR_SIZE = 3072  # Gemini gemini-embedding-2-preview 차원 수


def get_mongo_db():
    client = MongoClient(MONGO_URL)
    return client["AI_LawDoctor"]


def get_qdrant():
    return QdrantClient(url=QDRANT_URL, api_key=QDRANT_API_KEY)


def ensure_qdrant_collection(qdrant: QdrantClient):
    existing = [c.name for c in qdrant.get_collections().collections]
    if LAW_COLLECTION not in existing:
        qdrant.create_collection(
            collection_name=LAW_COLLECTION,
            vectors_config=VectorParams(size=VECTOR_SIZE, distance=Distance.COSINE)
        )
        print(f"Qdrant 컬렉션 '{LAW_COLLECTION}' 생성 완료")
    else:
        print(f"Qdrant 컬렉션 '{LAW_COLLECTION}' 이미 존재")


def objectid_to_uuid(object_id) -> str:
    """MongoDB ObjectId → 결정론적 UUID 변환 (uuid5 방식)"""
    return str(uuid.uuid5(uuid.NAMESPACE_DNS, str(object_id)))
