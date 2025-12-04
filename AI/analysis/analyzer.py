import os
import json
from dotenv import load_dotenv
from openai import OpenAI
import pytesseract
from PIL import Image
import pdfplumber

load_dotenv()
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

# OCR
def extract_text_from_image(image_path: str) -> str:
    img = Image.open(image_path)
    return pytesseract.image_to_string(img, lang="kor+eng", config="--psm 6")

# PDF 텍스트 추출
def extract_text_from_pdf(pdf_path: str) -> str:
    text = ""
    with pdfplumber.open(pdf_path) as pdf:
        for page in pdf.pages:
            page_text = page.extract_text()
            if page_text:
                text += page_text + "\n"
    return text

# 분석 함수 (JSON 형식 강제)
def analyze_contract(text: str) -> dict:
    prompt = f"""
    다음 계약서 내용을 분석해서 아래 JSON 형식으로 ONLY JSON만 출력해줘.

    형식:
    {{
        "summary": "핵심 요약",
        "riskItems": [
            {{
                "clauseText": "문제 조항 원문",
                "riskLevel": "high|medium|low",
                "reason": "이 조항이 왜 위험한지",
                "guide": "임차인 관점의 대응 가이드"
            }}
        ]
    }}

    계약서 내용:
    {text}
    """

    res = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[{"role": "user", "content": prompt}]
    )

    content = res.choices[0].message.content

    try:
        return json.loads(content)  # GPT가 준 JSON을 파싱
    except:
        return {"summary": "GPT 응답 파싱 실패", "riskItems": []}

# 파일 분석
def analyze_uploaded_file(file_path: str, mimetype: str) -> dict:
    if mimetype in ["image/png", "image/jpeg"]:
        extracted_text = extract_text_from_image(file_path)
    elif mimetype == "application/pdf":
        extracted_text = extract_text_from_pdf(file_path)
    else:
        return {"error": "지원하지 않는 파일 형식"}

    return analyze_contract(extracted_text)

#  Python 실행 (Node.js에서 호출용)
if __name__ == "__main__":
    import sys
    file_path = sys.argv[1]
    mimetype = sys.argv[2]

    result = analyze_uploaded_file(file_path, mimetype)
    print(json.dumps(result, ensure_ascii=False))
'''
print("===== DEBUG START =====")
print(f"file_path: {file_path}, mimetype: {mimetype}")  # 받은 인자
print("----- extracted text preview -----")
print(extracted_text[:500])  # 앞 500자만
print("----- GPT raw response -----")
print(content)
print("===== DEBUG END =====")
'''