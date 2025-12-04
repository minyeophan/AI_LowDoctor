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
def analyze_contract(text: str) -> str:
    prompt = f"""
    다음 계약서 내용에서 임차인에게 불리하거나 위험한 조항이 있다면 지적하고,
    초보자도 이해할 수 있도록 쉽게 설명해줘.
    그리고 어떻게 대응하거나 수정하면 좋은지도 함께 알려줘.

    계약서 내용:
    {text}
    """
    res = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[{"role": "user", "content": prompt}]
    )

    if res.choices and res.choices[0].message:
        gpt_reply = res.choices[0].message.content
        print("🧠 GPT 응답:\n", gpt_reply)  # 이 줄 추가해서 확인
        return gpt_reply
    return "⚠️ 분석 실패"


# 파일 분석
def analyze_uploaded_file(file_path: str, mimetype: str) -> dict:
    if mimetype in ["image/png", "image/jpeg"]:
        extracted_text = extract_text_from_image(file_path)
    elif mimetype == "application/pdf":
        extracted_text = extract_text_from_pdf(file_path)
    elif mimetype == "text/plain":
        with open(file_path, 'r', encoding='utf-8') as f:
            extracted_text = f.read()
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
