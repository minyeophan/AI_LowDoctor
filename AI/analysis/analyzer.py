import os
import io
import json
from dotenv import load_dotenv
from openai import OpenAI
import pytesseract
from PIL import Image
import pdfplumber
import sys

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

<<<<<<< HEAD
# 분석 함수 (JSON 형식 강제)a
def analyze_contract(text: str) -> dict:
    """GPT API를 호출하여 계약서 내용을 분석하고 JSON을 반환합니다."""
    prompt = f"""
    다음 계약서 내용을 분석해서 아래 JSON 형식으로 ONLY JSON만 출력해줘.
    
    주의: JSON이 아닌 다른 설명, 서론, 결론은 절대 포함하지 마세요.

    형식:
    {{
        "summary": "핵심 요약 (한글로 작성)",
        "riskItems": [
            {{
                "clauseText": "문제 조항 원문",
                "riskLevel": "high|medium|low",
                "reason": "이 조항이 왜 위험한지 (한글로 작성)",
                "guide": "임차인 관점의 대응 가이드 (한글로 작성)"
            }}
            // 위험 조항이 없으면 빈 배열 []
        ]
    }}
=======
# 분석 함수 (JSON 형식 강제)
def analyze_contract(text: str) -> str:
    prompt = f"""
    다음 계약서 내용에서 임차인에게 불리하거나 위험한 조항이 있다면 지적하고,
    초보자도 이해할 수 있도록 쉽게 설명해줘.
    그리고 어떻게 대응하거나 수정하면 좋은지도 함께 알려줘.
>>>>>>> b320d1edaa304676a474c80363657c8e1e925b95

    계약서 내용:
    {text}
    """
<<<<<<< HEAD

    try:
        res = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "You are an expert contract analyzer. Respond only with the requested JSON object."},
                {"role": "user", "content": prompt}
            ]
        )
=======
    res = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[{"role": "user", "content": prompt}]
    )

    if res.choices and res.choices[0].message:
        gpt_reply = res.choices[0].message.content
        print("🧠 GPT 응답:\n", gpt_reply)  # 이 줄 추가해서 확인
        return gpt_reply
    return "⚠️ 분석 실패"

>>>>>>> b320d1edaa304676a474c80363657c8e1e925b95

        content = res.choices[0].message.content.strip()

        # ----------------------------------------------------
        # ❗ JSON 파싱 실패 방지를 위한 응답 클리닝 로직
        # ----------------------------------------------------
        
        # 1. 마크다운 기호 제거 (```json, ```)
        if content.startswith("```json"):
            content = content.replace("```json", "", 1).strip()
        if content.endswith("```"):
            content = content[:-3].strip()

        # 2. 문자열에서 유효한 JSON 부분만 추출 (첫 '{' 부터 마지막 '}'까지)
        start_index = content.find('{')
        end_index = content.rfind('}')
        
        if start_index != -1 and end_index != -1 and start_index < end_index:
            # 첫 '{'부터 마지막 '}'까지 자름
            json_string = content[start_index:end_index + 1]
        else:
            # '{'와 '}'를 찾을 수 없거나 형식이 이상하면 원본 그대로 사용 시도
            json_string = content
        
        # 3. 최종 JSON 파싱 시도
        return json.loads(json_string)

    except Exception as e:
        # API 호출 또는 JSON 파싱 실패 시 오류 메시지 반환 및 디버깅 정보 출력
        import sys
        # 디버깅을 위해 GPT가 반환한 원본 내용을 stderr로 출력합니다.
        print(f"DEBUG: GPT Raw Content: {content}", file=sys.stderr) 
        return {"summary": f"GPT 응답 파싱 실패 (오류: {e})", "riskItems": []}
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

#  Python 실행 (Node.js에서 호출용)s
if __name__ == "__main__":

    try:
        sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
        sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')
    except Exception:
        # 이미 설정되어 있거나 detach할 수 없는 경우 무시
        pass

    if len(sys.argv) < 3:
        # 인자가 부족할 경우 오류 메시지 출력
        print(json.dumps({"summary": "오류: 파일 경로와 MIME 타입 인자가 필요합니다.", "riskItems": []}, ensure_ascii=False))
        sys.exit(1)
    file_path = sys.argv[1]
    mimetype = sys.argv[2]

    result = analyze_uploaded_file(file_path, mimetype)
    print(json.dumps(result, ensure_ascii=False))
