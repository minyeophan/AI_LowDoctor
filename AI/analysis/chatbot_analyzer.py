import os
from dotenv import load_dotenv
from google import genai

from analysis.law_search import search_legal_sources, build_context_text

load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
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