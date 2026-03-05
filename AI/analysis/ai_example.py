# ai_example.py
from google import genai
from google.genai import types
from dotenv import load_dotenv
import os
import json
import re

# ----------------------------------------
# 환경 변수 로드
# ----------------------------------------
load_dotenv()
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

# Gemini 클라이언트 설정
client = genai.Client(api_key=GEMINI_API_KEY)

# ----------------------------------------
# 계약서 분석 함수 정의
# ----------------------------------------
def analyze_contract(text: str) -> dict:
    """
    계약서 텍스트를 받아서
    1) 핵심 내용 요약(summary)
    2) 위험 조항 분석(riskItems)
    결과를 JSON 형태로 반환하는 함수
    """

    prompt = f"""
    [역할] 너는 한국 계약서 분석 전문가야. 반드시 JSON 형식만 출력하고, 최상위 키 (summary, riskItems, forms)를 포함해야 한다.

    아래 계약서 내용을 읽고 조항별로 매우 세세하게 위험을 분석해줘.

    - 핵심 내용은 summary 필드에 매우 상세하고 구조적으로 요약하며, 최소 500자 이상으로 작성할 것. 모든 조항의 중요 포인트를 깊이 있게 다룰 것.
    - 위험 조항은 riskItems 배열로 반환
    - riskItems 배열 각 항목에는 clauseText, riskLevel, reason, checkPoints, improvedClause 포함
    - JSON만 반환하고 추가 설명 금지
    - 동일한 reason이 반복되지 않도록 하고, 동일한 clauseText 조합이 중복되지 않도록 할 것
    - riskItems 배열은 riskLevel 순으로 high → medium → low 정렬
    - clauseText는 최대 200자로 표시
    - 분석이 어려운 조항은 reason과 checkPoints를 "분석 불가"로 표시
    - 각 조항의 위험을 판단할 때, 계약 실행 시 실제로 문제가 될 수 있는 사례를 구체적인 법적 근거 또는 판례를 언급하며 2~3문단 이상으로 상세히 설명할 것.
    - 각 조항의 checkPoints는 계약자가 반드시 확인해야 할 사항을 2~3개 항목의 배열로 작성할 것.
    - 각 조항의 improvedClause는 실제 계약서에 그대로 삽입 가능한 수정된 조항 문구를 작성할 것. 법률 조항을 명확히 언급하며 구체적으로 작성할 것.
    - 분석 결과, 사용자에게 추가적으로 필요한 법률 서식이나 양식이 있다면 forms 배열에 포함할 것.
    - forms 배열 각 항목에는 type, description, downloadUrl을 포함할 것.

    JSON 필드:
    - summary: 계약서 전체 요약
    - riskItems: [ {{ "clauseText": "원문 일부 (최대 200자)", "riskLevel": "low | medium | high", "reason": "위험한 이유", "checkPoints": ["확인사항1", "확인사항2"], "improvedClause": "수정된 조항 문구" }} ]
    - forms: [ {{ "type": "서식 종류", "description": "서식 설명", "downloadUrl": "다운로드 링크" }} ]

    계약서 내용:
    {text}
    """

    try:
        # ----------------------------------------
        # Gemini API 호출 (google-genai SDK)
        # ----------------------------------------
        response = client.models.generate_content(
            model="gemini-2.0-flash-lite",
            contents=prompt,
            config=types.GenerateContentConfig(
                system_instruction="너는 한국 계약서 분석 전문가야. 반드시 JSON 형식만 출력하고, 최상위 키 (summary, riskItems, forms)를 포함해야 한다. riskItems 각 항목에는 clauseText, riskLevel, reason, checkPoints(배열), improvedClause 필드가 있어야 한다.",
                response_mime_type="application/json",
                temperature=0.0
            )
        )

        result_str = response.text.strip()

        # ```json ... ``` 형식으로 출력했을 경우 JSON만 추출
        match = re.search(r"```json\s*(.*?)```", result_str, re.DOTALL)
        if match:
            result_str = match.group(1)

        return json.loads(result_str)

    except json.JSONDecodeError as e:
        print(f"❌ Gemini 응답이 올바른 JSON 형식이 아닙니다: {e}")
        raise

    except Exception as e:
        print(f"❌ 오류 발생: {type(e).__name__}: {str(e)}")
        raise
