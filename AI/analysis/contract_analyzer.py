# contract_analyzer.py
from google import genai
from google.genai import types
from dotenv import load_dotenv
import os
import json
import re
from analysis.law_search import search_laws

load_dotenv()
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
client = genai.Client(api_key=GEMINI_API_KEY)


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
    prompt = f"""
    아래 계약서 내용을 읽고 조항별로 매우 세세하게 위험을 분석해줘.
    - 핵심 내용은 summary 필드에 매우 상세하고 구조적으로 요약하며, 최소 500자 이상으로 작성할 것.
    - 위험 조항은 riskItems 배열로 반환, 핵심 위험 항목 최대 5개만 포함
    - riskItems 배열 각 항목에는 clauseText, riskLevel, reason, checkPoints(배열), improvedClause 필드가 있어야 한다.
    - JSON만 반환하고 추가 설명 금지
    - forms 배열 각 항목에는 type, description, downloadUrl을 포함할 것.
    {law_context}
    계약서 내용:
    {text}
    """

    try:
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt,
            config=types.GenerateContentConfig(
                system_instruction="너는 한국 계약서 분석 전문가야. 반드시 JSON 형식만 출력하고, 최상위 키 (summary, riskItems, forms)를 포함해야 한다. riskItems 각 항목에는 clauseText, riskLevel, reason, checkPoints(배열), improvedClause 필드가 있어야 한다.",
                response_mime_type="application/json",
                temperature=0.0,
                max_output_tokens=65536,
                thinking_config=types.ThinkingConfig(thinking_budget=0)
            )
        )
        result_str = response.text.strip()
        match = re.search(r"```json\s*(.*?)```", result_str, re.DOTALL)
        if match:
            result_str = match.group(1)

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

    except json.JSONDecodeError as e:
        print(f"Gemini 응답이 올바른 JSON 형식이 아닙니다: {e}")
        raise
    except Exception as e:
        print(f"오류 발생: {type(e).__name__}: {str(e)}")
        raise
