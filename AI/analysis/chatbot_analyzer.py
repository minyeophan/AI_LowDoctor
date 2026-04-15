import os
from dotenv import load_dotenv
from google import genai

from analysis.law_search import search_legal_sources, build_context_text

load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
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