#run.py
import os
import json

# 패키지 import
from analysis.ai_example import analyze_contract
from ocr.ocr_example import extract_text_from_pdf

# PDF 경로 지정
pdf_path = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "..", "samples", "sample_pdf1.pdf")
)

if not os.path.exists(pdf_path):
    print("⚠️ PDF 파일을 찾을 수 없습니다:", pdf_path)
    exit()

# OCR 수행
print("🔹 PDF에서 텍스트 추출 중...")
text = extract_text_from_pdf(pdf_path)
print("✅ OCR 완료\n")

# AI 분석
print("🔹 AI 분석 중...")
result = analyze_contract(text)
print("✅ 분석 완료\n")

# 결과 출력 (JSON)
print("=== 분석 결과 (JSON) ===")
print(json.dumps(result, indent=2, ensure_ascii=False))

# 대응 예시 출력
print("\n=== 대응 예시 ===")
for risk in result.get("risks", []):
    print(f"- 조항 종류: {risk['type']}")
    print(f"  위험 수준: {risk['risk_level']}")
    print(f"  문제 원문: {risk['excerpt']}")
    print(f"  위험 이유: {risk['reason']}")
    print(f"  대응 방법/수정 제안: {risk['suggested_fix']}\n")
