# ai_api.py

from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.responses import JSONResponse
from pydantic import BaseModel  # 요청 및 응답 데이터 구조 정의를 위한 라이브러리
import sys
import os
import shutil  # 파일 복사 및 이동을 위한 유틸리티
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

# 2. 기존 분석 함수 임포트

from ocr.pdf_extractor import extract_text_from_pdf
from analysis.contract_analyzer import analyze_contract
import subprocess
import tempfile


# 3. FastAPI 애플리케이션 초기화
app = FastAPI()

# ----------------------------------------------------
# 4. Pydantic 모델 정의: AI 분석 요청 시 데이터 구조
# ----------------------------------------------------
# Node.js에서 추출된 텍스트를 JSON 형태로 보낼 때, 
# 이 구조(스키마)에 맞춰야 FastAPI가 데이터를 정상적으로 인식합니다.
class AnalyzeRequest(BaseModel):
    extracted_text: str # 필수 필드는 'extracted_text'이며 타입은 문자열(str)

# 5. OCR 엔드포인트: PDF 파일을 받아 텍스트를 반환
# POST /api/ocr
@app.post("/api/ocr") # <--- Node.js가 파일 보내는 경로
async def ocr_pdf_file(file: UploadFile = File(...)):
    # 1. 파일 형식 유효성 검사 (보안 및 로직 안정성 확보)
    if not file.filename.lower().endswith(('.pdf', '.jpg', '.jpeg', '.png', '.txt')):
        raise HTTPException(status_code=400, detail="지원하지 않는 파일 형식입니다.")

    # 2. 임시 파일로 저장 경로 설정
    # OCR 라이브러리는 파일 경로를 요구하는 경우가 많아, 서버에 임시로 저장합니다.
    file_location = f"temp_files/{file.filename}"
    os.makedirs(os.path.dirname(file_location), exist_ok=True) # 폴더 없으면 생성
    
    try:
        # 3. 업로드된 파일 데이터를 임시 경로에 복사하여 저장
        with open(file_location, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        # 4. OCR 함수 호출 (기존 ocr_example.py의 핵심 로직 실행)
        extracted_text = extract_text_from_pdf(file_location)
        
        # 5. 임시 파일 삭제 (리소스 관리)
        os.remove(file_location)

        # 6. 결과 반환
        # Node.js의 ai_service.js가 예상하는 JSON 형식으로 반환합니다: { "text": "..." }
        return JSONResponse(content={"text": extracted_text})
        
    except Exception as e:
        # OCR 실패 시 임시 파일 정리 및 500 에러 반환
        print(f"❌ OCR 처리 중 에러 발생: {e}")
        if os.path.exists(file_location):
            os.remove(file_location) # 에러 발생 시 파일이 남아있지 않도록 정리
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

            # hwp5html은 index.xhtml로 출력
            html_files = [f for f in os.listdir(output_dir) if f.endswith(('.html', '.xhtml', '.htm'))]
            if not html_files:
                raise HTTPException(status_code=500, detail=f"HTML 파일 생성 실패. 생성된 파일: {os.listdir(output_dir)}")

            with open(os.path.join(output_dir, html_files[0]), "r", encoding="utf-8") as f:
                html = f.read()

            return JSONResponse(content={"html": html})

        except subprocess.TimeoutExpired:
            raise HTTPException(status_code=500, detail="HWP 변환 시간 초과")
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"변환 오류: {str(e)}")


@app.post("/api/ai-analyze") # <--- Node.js가 텍스트 보내는 경로
async def analyze_text(request: AnalyzeRequest):
    try:
        # 1. AI 분석 함수 호출 (기존 ai_example.py의 핵심 로직 실행)
        # 요청에서 파싱된 텍스트(request.extracted_text)를 인수로 전달합니다.
        ai_result = analyze_contract(request.extracted_text)
        
        # 2. 결과 반환
        # Node.js가 예상하는 최종 JSON 분석 결과를 반환합니다.
        return JSONResponse(content=ai_result)

    except Exception as e:
        # 분석 실패 시 500 에러 반환
        print(f"❌ AI 분석 중 에러 발생: {e}")
        raise HTTPException(status_code=500, detail=f"AI 분석 서버 오류: {str(e)}")

# ----------------------------------------------------
# 7. 서버 실행 방법 (터미널 명령어)
# ----------------------------------------------------
# Python 환경에서 이 파일을 실행하는 명령어입니다.
# Node.js의 AI_SERVER_URL(기본: http://localhost:8000)과 포트 번호를 일치시켜야 합니다.
# uvicorn ai_api:app --host 0.0.0.0 --port 8000