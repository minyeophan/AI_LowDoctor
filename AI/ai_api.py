from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.responses import JSONResponse
from pydantic import BaseModel
import sys
import os
import shutil

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from ocr.pdf_extractor import extract_text_from_pdf
from analysis.contract_analyzer import analyze_contract
from analysis.chatbot_analyzer import answer_legal_question

app = FastAPI()


class AnalyzeRequest(BaseModel):
    extracted_text: str


class ChatRequest(BaseModel):
    question: str


@app.post("/api/ocr")
async def ocr_pdf_file(file: UploadFile = File(...)):
    if not file.filename.lower().endswith(('.pdf', '.jpg', '.jpeg', '.png', 'txt')):
        raise HTTPException(status_code=400, detail="지원하지 않는 파일 형식입니다.")

    file_location = f"temp_files/{file.filename}"
    os.makedirs(os.path.dirname(file_location), exist_ok=True)

    try:
        with open(file_location, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        extracted_text = extract_text_from_pdf(file_location)

        if os.path.exists(file_location):
            os.remove(file_location)

        return JSONResponse(content={"text": extracted_text})

    except Exception as e:
        print(f"❌ OCR 처리 중 에러 발생: {e}")

        if os.path.exists(file_location):
            os.remove(file_location)

        raise HTTPException(status_code=500, detail=f"OCR 서버 오류: {str(e)}")


@app.post("/api/ai-analyze")
async def ai_analyze(request: AnalyzeRequest):
    try:
        result = analyze_contract(request.extracted_text)
        return JSONResponse(content=result)

    except Exception as e:
        print(f"❌ AI 분석 중 에러 발생: {e}")
        raise HTTPException(status_code=500, detail=f"AI 분석 서버 오류: {str(e)}")


@app.post("/api/chat")
async def chat_with_ai(request: ChatRequest):
    try:
        if not request.question or not request.question.strip():
            raise HTTPException(status_code=400, detail="question 값이 필요합니다.")

        result = answer_legal_question(request.question.strip())
        return JSONResponse(content=result)

    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ 챗봇 응답 중 에러 발생: {e}")
        raise HTTPException(status_code=500, detail=f"챗봇 서버 오류: {str(e)}")