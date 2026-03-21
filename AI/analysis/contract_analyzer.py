# contract_analyzer.py
from google import genai
from google.genai import types
from dotenv import load_dotenv
import os
import json
import re
from analysis.law_search import search_laws

# ----------------------------------------
# 환경 변수 로드
# ----------------------------------------
load_dotenv()
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

# Gemini 클라이언트 설정
client = genai.Client(api_key=GEMINI_API_KEY)

<<<<<<<< Updated upstream:AI/analysis/contract_analyzer.py

def _build_law_context(law_refs: list[dict]) -> str:
    """검색된 법령 조문을 프롬프트에 삽입할 텍스트로 변환"""
    if not law_refs:
        return ""
    lines = ["[관련 법령 조문]"]
    for ref in law_refs:
        title = f"({ref['articleTitle']})" if ref["articleTitle"] else ""
        lines.append(f"\n■ {ref['lawName']} 제{ref['articleNum']}조{title}")
        lines.append(ref["content"])
    return "\n".join(lines)


def analyze_contract(text: str) -> dict:
    # 1. 계약서와 관련된 법령 검색
    try:
        law_refs = search_laws(text, top_k=5)
    except Exception as e:
        print(f"법령 검색 실패 (계속 진행): {e}")
        law_refs = []

    law_context = _build_law_context(law_refs)

    # 2. 법령 컨텍스트를 포함한 프롬프트 구성
========
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

>>>>>>>> Stashed changes:AI/analysis/ai_example.py
    prompt = f"""
    [역할] 너는 한국 계약서 분석 전문가야. 반드시 JSON 형식만 출력하고, 최상위 키 (summary, riskItems, forms)를 포함해야 한다.

    아래 계약서 내용을 읽고 조항별로 매우 세세하게 위험을 분석해줘.

    - 핵심 내용은 summary 필드에 매우 상세하고 구조적으로 요약하며, 최소 500자 이상으로 작성할 것.
    - 위험 조항은 riskItems 배열로 반환, 핵심 위험 항목 최대 5개만 포함
    - riskItems 배열 각 항목에는 clauseText, riskLevel, reason, checkPoints, improvedClause 포함
    - JSON만 반환하고 추가 설명 금지
    - 동일한 reason이 반복되지 않도록 하고, 동일한 clauseText 조합이 중복되지 않도록 할 것
    - riskItems 배열은 riskLevel 순으로 high → medium → low 정렬
    - clauseText는 최대 200자로 표시
    - 분석이 어려운 조항은 reason과 checkPoints를 "분석 불가"로 표시
    - 각 조항의 위험을 판단할 때, 계약 실행 시 실제로 문제가 될 수 있는 사례를 구체적인 법적 근거 또는 판례를 언급하며 1~2문단 이상으로 상세히 설명할 것.
    - 각 조항의 checkPoints는 계약자가 반드시 확인해야 할 사항을 2~3개 항목의 배열로 작성할 것.
    - 각 조항의 improvedClause는 실제 계약서에 그대로 삽입 가능한 수정된 조항 문구를 작성할 것. 법률 조항을 명확히 언급하며 구체적으로 작성할 것.
    - 분석 결과, 사용자에게 추가적으로 필요한 법률 서식이나 양식이 있다면 forms 배열에 포함할 것.
    - forms 배열 각 항목에는 type, description, downloadUrl을 포함할 것.
<<<<<<<< Updated upstream:AI/analysis/contract_analyzer.py
    {law_context}
========

    JSON 필드:
    - summary: [ {{ "title": "핵심 제목 (예: 계약 당사자, 보증금 및 월세)", "content": "해당 내용 요약 (100자 이내)" }} ] (최대 5개 항목)
    - riskItems: [ {{ "clauseText": "원문 일부 (최대 200자)", "riskLevel": "low | medium | high", "reason": "위험한 이유", "checkPoints": ["확인사항1", "확인사항2"], "improvedClause": "수정된 조항 문구" }} ]
    - forms: [ {{ "type": "서식 종류", "description": "서식 설명", "downloadUrl": "다운로드 링크" }} ]

>>>>>>>> Stashed changes:AI/analysis/ai_example.py
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
                temperature=0.0,
                max_output_tokens=65536,
            
)
        )

        result_str = response.text.strip()
        # ```json ... ``` 형식으로 출력했을 경우 JSON만 추출
        match = re.search(r"```json\s*(.*?)```", result_str, re.DOTALL)
        if match:
            result_str = match.group(1)
<<<<<<<< Updated upstream:AI/analysis/contract_analyzer.py

        result = json.loads(result_str)

        # 3. 검색된 법령을 lawRefs로 추가
        result["lawRefs"] = [
            {
                "lawName": r["lawName"],
                "articleNum": r["articleNum"],
                "articleTitle": r["articleTitle"],
                "content": r["content"],
            }
            for r in law_refs
        ]

        return result

========
        try:
            return json.loads(result_str)
        except json.JSONDecodeError:
            # 잘린 JSON 복구 시도
            depth = 0
            last_valid = 0
            for i, c in enumerate(result_str):
                if c == '{': depth += 1
                elif c == '}':
                    depth -= 1
                    if depth == 0:
                        last_valid = i
            if last_valid > 0:
                try:
                    return json.loads(result_str[:last_valid+1])
                except:
                    pass
            return {"summary": "분석 중 오류가 발생했습니다.", "riskItems": [], "forms": []}
>>>>>>>> Stashed changes:AI/analysis/ai_example.py
    except json.JSONDecodeError as e:
        print(f"Gemini 응답이 올바른 JSON 형식이 아닙니다: {e}")
        raise

    except Exception as e:
        print(f"오류 발생: {type(e).__name__}: {str(e)}")
        raise
