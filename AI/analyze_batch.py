"""
PDF 계약서 일괄 분석 스크립트
- PDF 파일을 OCR로 텍스트 추출 후 AI 분석
- 위험 수준(riskLevel) + 위험한 이유(reason) 정리해서 텍스트 파일로 저장
- 전문가 검토용 리포트 생성

사용법:
  python analyze_batch.py <PDF파일_또는_폴더>

예시:
  python analyze_batch.py contracts/계약서01.pdf
  python analyze_batch.py contracts/
"""

import sys
import os
import time
import requests
import json
from pathlib import Path
from datetime import datetime

AI_SERVER = "http://localhost:8000"

RISK_LEVEL_KO = {
    "HIGH": "높음",
    "MEDIUM": "중간",
    "LOW": "낮음",
}


def ocr_pdf(pdf_path: str) -> str:
    with open(pdf_path, "rb") as f:
        response = requests.post(
            f"{AI_SERVER}/api/ocr",
            files={"file": (os.path.basename(pdf_path), f, "application/pdf")},
            timeout=120,
        )
    response.raise_for_status()
    return response.json()["text"]


def analyze_text(text: str) -> dict:
    response = requests.post(
        f"{AI_SERVER}/api/ai-analyze",
        json={"extracted_text": text},
        timeout=180,
    )
    response.raise_for_status()
    return response.json()


def build_report(filename: str, result: dict) -> str:
    lines = []
    lines.append("=" * 60)
    lines.append(f"파일명: {filename}")
    lines.append(f"분석 일시: {datetime.now().strftime('%Y-%m-%d %H:%M')}")
    lines.append("=" * 60)

    # 요약
    lines.append("\n[계약서 요약]")
    lines.append(result.get("summary", "(요약 없음)"))

    # 위험 항목
    risk_items = result.get("riskItems", [])
    lines.append(f"\n[위험 항목 ({len(risk_items)}개)]")
    for i, item in enumerate(risk_items, 1):
        level = item.get("riskLevel", "")
        level_ko = RISK_LEVEL_KO.get(level, level)
        lines.append(f"\n  {i}. 위험 수준: {level_ko} ({level})")
        lines.append(f"     위험한 이유: {item.get('reason', '')}")
        lines.append(f"     해당 조항: {item.get('clauseText', '')[:100]}...")
        check_points = item.get("checkPoints", [])
        if check_points:
            lines.append("     확인 사항:")
            for cp in check_points:
                lines.append(f"       - {cp}")
        lines.append(f"     개선 제안: {item.get('improvedClause', '')}")

    lines.append("\n" + "-" * 60)
    lines.append("[전문가 검토 의견]")
    lines.append("(전문가 작성란)")
    lines.append("")

    return "\n".join(lines)


def process_file(pdf_path: str, output_dir: str):
    filename = os.path.basename(pdf_path)
    print(f"\n처리 중: {filename}")

    print("  1/2 OCR 텍스트 추출...")
    text = ocr_pdf(pdf_path)
    print(f"      추출 완료 ({len(text)}자)")

    print("  2/2 AI 분석 중...")
    result = analyze_text(text)
    print("      분석 완료")

    report = build_report(filename, result)

    # 리포트 파일 저장
    stem = Path(pdf_path).stem
    report_path = os.path.join(output_dir, f"{stem}_분석리포트.txt")
    with open(report_path, "w", encoding="utf-8") as f:
        f.write(report)

    # 원본 JSON도 저장 (나중에 활용 가능)
    json_path = os.path.join(output_dir, f"{stem}_raw.json")
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(result, f, ensure_ascii=False, indent=2)

    print(f"      리포트 저장: {report_path}")
    return report_path


def main():
    if len(sys.argv) < 2:
        print("사용법: python analyze_batch.py <PDF파일_또는_폴더>")
        sys.exit(1)

    target = sys.argv[1]
    output_dir = "분석결과"
    os.makedirs(output_dir, exist_ok=True)

    if os.path.isfile(target):
        pdf_files = [target]
    elif os.path.isdir(target):
        pdf_files = [
            os.path.join(target, f)
            for f in os.listdir(target)
            if f.lower().endswith(".pdf")
        ]
        pdf_files.sort()
    else:
        print(f"파일 또는 폴더를 찾을 수 없습니다: {target}")
        sys.exit(1)

    if not pdf_files:
        print("PDF 파일이 없습니다.")
        sys.exit(1)

    print(f"총 {len(pdf_files)}개 파일 처리 시작")
    print(f"결과 저장 위치: {os.path.abspath(output_dir)}/")

    success, fail = 0, 0
    for i, pdf_path in enumerate(pdf_files):
        try:
            process_file(pdf_path, output_dir)
            success += 1
            # Gemini 무료 티어 분당 10회 제한 대비 (마지막 파일 제외)
            if i < len(pdf_files) - 1:
                print("  대기 중 (7초)...")
                time.sleep(7)
        except Exception as e:
            print(f"  ❌ 실패: {e}")
            fail += 1

    print(f"\n완료: 성공 {success}개 / 실패 {fail}개")
    print(f"리포트 위치: {os.path.abspath(output_dir)}/")


if __name__ == "__main__":
    main()
