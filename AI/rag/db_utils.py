import os
<<<<<<< HEAD
import uuid
from pymongo import MongoClient
from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams
=======
>>>>>>> 993fa18 (feat: 챗봇 RAG 검색 및 법령/용어/지식베이스 연동 구현)
from dotenv import load_dotenv
from pymongo import MongoClient
from qdrant_client import QdrantClient, models
from bson import ObjectId
import uuid

load_dotenv()

MONGODB_URI = (
    os.getenv("MONGODB_URI")
    or os.getenv("MONGO_URI")
    or os.getenv("MONGO_URL")
)

QDRANT_URL = os.getenv("QDRANT_URL", "http://qdrant:6333")
QDRANT_API_KEY = os.getenv("QDRANT_API_KEY", "")
LAW_COLLECTION = os.getenv("LAW_COLLECTION", "law_chunks")

DENSE_VECTOR_NAME = "dense"
SPARSE_VECTOR_NAME = "sparse"
DENSE_VECTOR_SIZE = 3072


def get_mongo_db():
    if not MONGODB_URI:
        raise RuntimeError(
            "MongoDB 연결 문자열이 없습니다. "
            "MONGODB_URI / MONGO_URI / MONGO_URL 중 하나를 설정하세요."
        )

    client = MongoClient(MONGODB_URI)
    db_name = MONGODB_URI.rsplit("/", 1)[-1].split("?")[0]
    return client[db_name]


def get_qdrant():
<<<<<<< HEAD
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
=======
    if QDRANT_API_KEY:
        return QdrantClient(url=QDRANT_URL, api_key=QDRANT_API_KEY)
    return QdrantClient(url=QDRANT_URL)


def objectid_to_uuid(obj_id: ObjectId) -> str:
    return str(uuid.uuid5(uuid.NAMESPACE_DNS, str(obj_id)))


def ensure_qdrant_collection(qdrant: QdrantClient):
    collections = [c.name for c in qdrant.get_collections().collections]
    if LAW_COLLECTION in collections:
        return

    qdrant.create_collection(
        collection_name=LAW_COLLECTION,
        vectors_config={
            DENSE_VECTOR_NAME: models.VectorParams(
                size=DENSE_VECTOR_SIZE,
                distance=models.Distance.COSINE,
            )
        },
        sparse_vectors_config={
            SPARSE_VECTOR_NAME: models.SparseVectorParams(
                modifier=models.Modifier.IDF
            )
        },
    )
>>>>>>> 993fa18 (feat: 챗봇 RAG 검색 및 법령/용어/지식베이스 연동 구현)
