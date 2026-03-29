import os
from dotenv import load_dotenv
from google import genai

from analysis.law_search import search_legal_sources, build_context_text

load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
<<<<<<< HEAD
GEMINI_CHAT_MODEL = os.getenv("GEMINI_CHAT_MODEL", "gemini-2.5-flash")

if not GEMINI_API_KEY:
    raise RuntimeError("GEMINI_API_KEY가 설정되어 있지 않습니다.")

client = genai.Client(api_key=GEMINI_API_KEY)


def answer_legal_question(question: str) -> dict:
    grouped = search_legal_sources(question, top_k=8)
    context_text = build_context_text(grouped)

    prompt = f"""
너는 법률 비전문가를 위한 AI 법률 챗봇이다.

규칙:
1. 어려운 법률 용어는 쉬운 말로 설명한다.
2. 제공된 검색 결과에 근거해서만 답변한다.
3. 모르면 "관련 정보를 찾을 수 없습니다"라고 말한다.
4. 처음 서류를 작성하는 사람의 관점에서 설명한다.
5. 검색 결과에 없는 법조문 번호나 판례번호를 임의로 만들지 않는다.

반드시 아래 형식으로 답변하라.

[쉬운 설명]
- 이해하기 쉬운 말로 설명

[법적 근거]
- 관련 법령 / 해석 / 판례를 간단히 정리

[대응 방법]
- 사용자가 지금 할 수 있는 행동을 2~4개 안내

[주의]
- 불확실한 점이나 추가 확인이 필요한 부분 안내

사용자 질문:
{question}

검색 결과:
{context_text}
""".strip()

    response = client.models.generate_content(
        model=GEMINI_CHAT_MODEL,
        contents=prompt,
    )

    answer_text = response.text if hasattr(response, "text") else str(response)

    return {
        "answer": answer_text,
        "references": grouped,
    }
=======
if not GEMINI_API_KEY:
    raise RuntimeError("GEMINI_API_KEY가 설정되어 있지 않습니다.")

gemini_client = genai.Client(api_key=GEMINI_API_KEY)


def answer_chat(question: str) -> str:
    question = (question or "").strip()
    if not question:
        return "질문이 비어 있습니다."

    grouped = search_legal_sources(question, top_k=8)
    context_text = build_context_text(grouped)

    has_any_result = any(len(grouped[key]) > 0 for key in grouped)
    if not has_any_result:
        return "관련 정보를 찾을 수 없습니다. 다른 표현으로 다시 질문해 주세요."

    prompt = f"""
너는 부동산/임대차 계약 관련 법률 도우미다.

아래 [검색 결과]만 근거로 사용해서 질문에 답변해라.

규칙:
1. 검색 결과에 없는 내용은 단정하지 말 것
2. 법률 비전문가도 이해하기 쉬운 말로 설명할 것
3. 가능하면 관련 법령명, 조문명, 용어명을 함께 언급할 것
4. 질문이 "뜻", "의미", "뭐야", "정의" 같은 정의형 질문이면
   가장 먼저 쉬운 한 줄 정의를 주고, 그다음 짧게 보충 설명할 것
5. 답변은 너무 길지 않게 3~6문장 정도로 작성할 것
6. 불확실하면 "검색 결과 기준으로는" 같은 표현을 사용할 것

[사용자 질문]
{question}

[검색 결과]
{context_text}
""".strip()

    response = gemini_client.models.generate_content(
        model="gemini-2.5-flash",
        contents=prompt,
    )

    answer = (response.text or "").strip()
    if not answer:
        return "답변을 생성하지 못했습니다."

    return answer
>>>>>>> 993fa18 (feat: 챗봇 RAG 검색 및 법령/용어/지식베이스 연동 구현)
