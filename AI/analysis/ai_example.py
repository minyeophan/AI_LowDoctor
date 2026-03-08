# ai_example.py
from google import genai
from google.genai import types
from dotenv import load_dotenv
import os
import json
import re

load_dotenv()
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
client = genai.Client(api_key=GEMINI_API_KEY)

def analyze_contract(text: str) -> dict:
    prompt = f"""
    아래 계약서 내용을 읽고 조항별로 매우 세세하게 위험을 분석해줘.
    - 핵심 내용은 summary 필드에 매우 상세하고 구조적으로 요약하며, 최소 500자 이상으로 작성할 것.
    - 위험 조항은 riskItems 배열로 반환, 핵심 위험 항목 최대 5개만 포함
    - riskItems 배열 각 항목에는 clauseText, riskLevel, reason, checkPoints(배열), improvedClause 필드가 있어야 한다.
    - JSON만 반환하고 추가 설명 금지
    - forms 배열 각 항목에는 type, description, downloadUrl을 포함할 것.
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
        return json.loads(result_str)
    except json.JSONDecodeError as e:
        print(f"Gemini 응답이 올바른 JSON 형식이 아닙니다: {e}")
        raise
    except Exception as e:
        print(f"오류 발생: {type(e).__name__}: {str(e)}")
        raise
