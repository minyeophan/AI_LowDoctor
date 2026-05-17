# contract_analyzer.py
from google import genai
from google.genai import types
from dotenv import load_dotenv
from json_repair import repair_json
import os
import json
import re
from analysis.law_search import search_laws, search_expert_corrections

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


def _detect_contract_type(text: str) -> str | None:
    """계약서 텍스트에서 계약 유형 키워드를 감지"""
    if any(k in text for k in ("상가", "점포", "영업소", "오피스")):
        return "상가건물"
    if any(k in text for k in ("원룸", "고시원", "다가구")):
        return "원룸"
    if any(k in text for k in ("단독주택", "아파트", "빌라", "오피스텔", "공동주택")):
        return "단독주택"
    return None


def _build_expert_context(corrections: list[dict]) -> str:
    """전문가 교정 사례를 프롬프트에 삽입할 텍스트로 변환"""
    if not corrections:
        return ""
    lines = [
        "[전문가 실무 교정 사례 — 반드시 준수]",
        "아래는 AI가 실제로 범한 오류 패턴을 법률 전문가가 교정한 사례입니다.",
        "같거나 유사한 조항을 분석할 때 아래 오류를 반드시 피하고, 전문가가 제시한 실무 관행에 따라 위험 수준을 조정하세요.\n",
    ]
    for i, c in enumerate(corrections, 1):
        correction_label = "오류 교정" if c.get("correction_type") == "correction" else "보완 의견"
        lines.append(f"[사례 {i}] {correction_label} ({c.get('contract_type', '')})")
        if c.get("clause_text"):
            lines.append(f"조항: {c['clause_text'][:150]}")
        if c.get("expert_opinion"):
            lines.append(f"전문가 의견: {c['expert_opinion'][:300]}")
        lines.append("")
    return "\n".join(lines)


def analyze_contract(text: str) -> dict:
    # 1. 법령 검색 + 전문가 교정 사례 검색 (병렬 진행)
    law_refs = []
    expert_corrections = []

    try:
        law_refs = search_laws(text, top_k=7)
    except Exception as e:
        print(f"법령 검색 실패 (계속 진행): {e}")

    try:
        detected_type = _detect_contract_type(text)
        expert_corrections = search_expert_corrections(text, top_k=3, contract_type=detected_type)
        if detected_type:
            print(f"계약 유형 감지: {detected_type} (전문가 교정 필터 적용)")
    except Exception as e:
        print(f"전문가 교정 사례 검색 실패 (계속 진행): {e}")

    law_context = _build_law_context(law_refs)
    expert_context = _build_expert_context(expert_corrections)

    # 2. 법령 + 전문가 교정 컨텍스트를 포함한 프롬프트 구성
    prompt = f"""
    아래 계약서 내용을 읽고 조항별로 매우 세세하게 위험을 분석해줘.
    - summary: 핵심 내용을 매우 상세하고 구조적으로 요약하며, 최소 500자 이상으로 작성할 것.
    - riskItems: 핵심 위험 항목 최대 7개만 포함. riskLevel은 HIGH/MEDIUM/LOW 중 하나.
    {law_context}
    {expert_context}
    계약서 내용:
    {text}
    """

    try:
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt,
            config=types.GenerateContentConfig(
                system_instruction=(
                    "너는 한국 부동산 계약서 분석 전문가야.\n"
                    "반드시 JSON 형식만 출력해.\n"
                    "최상위 키는 summary(string), riskItems(array)이며,\n"
                    "riskItems 각 항목은 clauseText, riskLevel, reason, checkPoints(string array), improvedClause 필드를 포함해야 해."
                ),
                response_mime_type="application/json",  # JSON 외 텍스트 출력 방지
                temperature=0.0,                        # 동일 계약서 재분석 시 항상 같은 결과 보장
                max_output_tokens=10000,                # 긴 계약서도 잘리지 않도록 최대값 설정
                thinking_config=types.ThinkingConfig(thinking_budget=0)  # 법령 컨텍스트를 직접 제공하므로 비활성화, 정답 데이터 확보 후 최적값 실험 예정
            )
        )
        result_str = response.text.strip()
        match = re.search(r"```json\s*(.*?)```", result_str, re.DOTALL)
        if match:
            result_str = match.group(1)

        # Gemini가 잘못된 JSON을 반환하는 경우 자동 수리 후 파싱
        result = json.loads(repair_json(result_str))

        # 3. 검색된 법령 + 전문가 교정 사례를 결과에 추가
        result["lawRefs"] = [
            {
                "lawName": r["lawName"],
                "articleNum": r["articleNum"],
                "articleTitle": r["articleTitle"],
                "content": r["content"],
            }
            for r in law_refs
        ]
        result["expertCorrectionRefs"] = [
            {
                "contractType": c.get("contract_type", ""),
                "correctionType": c.get("correction_type", ""),
                "clauseText": c.get("clause_text", ""),
                "expertOpinion": c.get("expert_opinion", ""),
            }
            for c in expert_corrections
        ]

        return result

    except json.JSONDecodeError as e:
        print(f"Gemini 응답이 올바른 JSON 형식이 아닙니다: {e}")
        raise
    except Exception as e:
        print(f"오류 발생: {type(e).__name__}: {str(e)}")
        raise
