# ai_api.py

from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.responses import JSONResponse
from pydantic import BaseModel
import sys
import os
import shutil
import subprocess
import tempfile
import io
import re
import base64
import pytesseract
from PIL import Image
import pdfplumber
from google import genai
from google.genai import types as genai_types
from dotenv import load_dotenv

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from ocr.pdf_extractor import extract_text_from_pdf
from analysis.contract_analyzer import analyze_contract

load_dotenv()
_gemini_client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

app = FastAPI()

_PDF_TO_HTML_PROMPT = """이 PDF 페이지를 HTML로 변환해줘.
규칙:
- 표는 반드시 <table><tr><td> 구조로 변환
- 제목/소제목은 <h2> 또는 <h3> 태그 사용
- 일반 텍스트는 <p> 태그
- 마크다운 사용 금지
- 코드 블록(```) 사용 금지
- HTML 태그만 출력, 다른 설명 없이"""

_HWP_IMG_PROMPT = "이 이미지의 텍스트나 내용을 추출해줘. 도장이나 서명이면 이름을 추출해줘. 없으면 이미지 내용을 한 줄로 설명해줘."


def _process_hwp_images(html: str, output_dir: str) -> str:
    """HWP 변환 HTML의 img 태그를 base64 embed + OCR(pytesseract → Gemini Vision) 처리"""
    img_pattern = re.compile(r'<img([^>]*)/?>', re.IGNORECASE)

    found_imgs = img_pattern.findall(html)
    print(f"[HWP 이미지] HTML에서 발견된 img 태그 수: {len(found_imgs)}")
    print(f"[HWP 이미지] output_dir 파일 목록: {os.listdir(output_dir)}")

    def replace_img(match):
        attrs = match.group(1)
        src_match = re.search(r'src=["\']([^"\']+)["\']', attrs, re.IGNORECASE)
        if not src_match:
            print(f"[HWP 이미지] src 속성 없는 img 태그 스킵: {match.group(0)[:80]}")
            return match.group(0)

        src = src_match.group(1)
        img_path = os.path.join(output_dir, src)
        print(f"[HWP 이미지] 처리 시도: src={src}, 경로={img_path}, 존재={os.path.exists(img_path)}")

        if not os.path.exists(img_path):
            print(f"[HWP 이미지] ❌ 파일 없음: {img_path}")
            return match.group(0)

        with open(img_path, 'rb') as f:
            img_bytes = f.read()
        print(f"[HWP 이미지] ✅ 파일 읽기 성공: {len(img_bytes)} bytes")

        ext = os.path.splitext(src)[1].lower().lstrip('.')
        mime = {'png': 'image/png', 'jpg': 'image/jpeg', 'jpeg': 'image/jpeg',
                'gif': 'image/gif', 'bmp': 'image/bmp'}.get(ext, 'image/png')
        b64 = base64.b64encode(img_bytes).decode()
        print(f"[HWP 이미지] base64 변환 완료: mime={mime}, b64 길이={len(b64)}")

        # 1. pytesseract OCR 시도
        alt_text = ''
        try:
            pil_img = Image.open(io.BytesIO(img_bytes))
            ocr_result = pytesseract.image_to_string(pil_img, lang='kor+eng').strip()
            if ocr_result:
                alt_text = ocr_result
                print(f"[HWP 이미지] pytesseract 성공: {alt_text[:50]}")
            else:
                print(f"[HWP 이미지] pytesseract 결과 없음 → Gemini Vision 시도")
        except Exception as e:
            print(f"[HWP 이미지] pytesseract 예외: {e} → Gemini Vision 시도")

        # 2. pytesseract 실패 시 Gemini Vision 폴백
        if not alt_text:
            try:
                response = _gemini_client.models.generate_content(
                    model="gemini-2.0-flash",
                    contents=[
                        genai_types.Part.from_bytes(data=img_bytes, mime_type=mime),
                        _HWP_IMG_PROMPT
                    ]
                )
                alt_text = response.text.strip()
                print(f"[HWP 이미지] Gemini Vision 성공: {alt_text[:50]}")
            except Exception as e:
                print(f"[HWP 이미지] Gemini Vision 예외: {e} → alt 빈값 처리")

        alt_text = alt_text.replace('"', '&quot;').replace('\n', ' ')
        print(f"[HWP 이미지] ✅ 최종 처리 완료: alt={alt_text[:30]}")
        return f'<img src="data:{mime};base64,{b64}" alt="{alt_text}">'

    return img_pattern.sub(replace_img, html)


class AnalyzeRequest(BaseModel):
    extracted_text: str


@app.post("/api/ocr")
async def ocr_pdf_file(file: UploadFile = File(...)):
    if not file.filename.lower().endswith(('.pdf', '.jpg', '.jpeg', '.png', '.txt')):
        raise HTTPException(status_code=400, detail="지원하지 않는 파일 형식입니다.")

    file_location = f"temp_files/{file.filename}"
    os.makedirs(os.path.dirname(file_location), exist_ok=True)

    try:
        with open(file_location, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        extracted_text = extract_text_from_pdf(file_location)
        os.remove(file_location)
        return JSONResponse(content={"text": extracted_text})

    except Exception as e:
        print(f"❌ OCR 처리 중 에러 발생: {e}")
        if os.path.exists(file_location):
            os.remove(file_location)
        raise HTTPException(status_code=500, detail=f"OCR 서버 오류: {str(e)}")


@app.post("/api/convert-hwp")
async def convert_hwp(file: UploadFile = File(...)):
    if not file.filename.lower().endswith(('.hwp', '.hwpx')):
        raise HTTPException(status_code=400, detail="HWP/HWPX 파일만 지원합니다.")

    ext = os.path.splitext(file.filename.lower())[1]

    with tempfile.TemporaryDirectory() as tmpdir:
        input_path = os.path.join(tmpdir, f"input{ext}")
        output_dir = os.path.join(tmpdir, "out")
        os.makedirs(output_dir, exist_ok=True)

        with open(input_path, "wb") as f:
            shutil.copyfileobj(file.file, f)

        try:
            result = subprocess.run(
                ["hwp5html", "--output", output_dir, input_path],
                capture_output=True, text=True, timeout=30
            )
            if result.returncode != 0:
                raise HTTPException(status_code=500, detail=f"HWP 변환 실패: {result.stderr}")

            html_files = [f for f in os.listdir(output_dir) if f.endswith(('.html', '.xhtml', '.htm'))]
            if not html_files:
                raise HTTPException(status_code=500, detail=f"HTML 파일 생성 실패. 생성된 파일: {os.listdir(output_dir)}")

            with open(os.path.join(output_dir, html_files[0]), "r", encoding="utf-8") as f:
                html = f.read()

            # 이미지 base64 embed + OCR 처리 (임시폴더 삭제 전에 실행)
            html = _process_hwp_images(html, output_dir)

            return JSONResponse(content={"html": html})

        except subprocess.TimeoutExpired:
            raise HTTPException(status_code=500, detail="HWP 변환 시간 초과")
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"변환 오류: {str(e)}")


@app.post("/api/convert-pdf")
async def convert_pdf(file: UploadFile = File(...)):
    if not file.filename.lower().endswith('.pdf'):
        raise HTTPException(status_code=400, detail="PDF 파일만 지원합니다.")

    with tempfile.TemporaryDirectory() as tmpdir:
        input_path = os.path.join(tmpdir, "input.pdf")
        with open(input_path, "wb") as f:
            shutil.copyfileobj(file.file, f)

        try:
            html_parts = []

            with pdfplumber.open(input_path) as pdf:
                for page in pdf.pages:
                    # 페이지 전체를 이미지로 변환 후 Gemini Vision으로 HTML 생성
                    pil_image = page.to_image(resolution=150).original
                    buffer = io.BytesIO()
                    pil_image.save(buffer, format='PNG')
                    img_bytes = buffer.getvalue()

                    response = _gemini_client.models.generate_content(
                        model="gemini-2.0-flash",
                        contents=[
                            genai_types.Part.from_bytes(data=img_bytes, mime_type="image/png"),
                            _PDF_TO_HTML_PROMPT
                        ]
                    )

                    page_html = response.text.strip()
                    # 마크다운 코드 블록 혹시 포함되면 제거
                    match = re.search(r"```(?:html)?\s*(.*?)```", page_html, re.DOTALL)
                    if match:
                        page_html = match.group(1).strip()

                    html_parts.append(page_html)

            return JSONResponse(content={"html": '\n'.join(html_parts)})

        except Exception as e:
            raise HTTPException(status_code=500, detail=f"PDF 변환 오류: {str(e)}")


@app.post("/api/ai-analyze")
async def analyze_text(request: AnalyzeRequest):
    try:
        ai_result = analyze_contract(request.extracted_text)
        return JSONResponse(content=ai_result)
    except Exception as e:
        print(f"❌ AI 분석 중 에러 발생: {e}")
        raise HTTPException(status_code=500, detail=f"AI 분석 서버 오류: {str(e)}")

# uvicorn ai_api:app --host 0.0.0.0 --port 8000
