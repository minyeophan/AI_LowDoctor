from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.responses import JSONResponse
from pydantic import BaseModel
import os
import shutil
import sys

sys.path.append(os.path.abspath(os.path.dirname(__file__)))

from ocr.pdf_extractor import extract_text_from_pdf
from analysis.contract_analyzer import analyze_contract
from analysis.chatbot_analyzer import answer_chat

app = FastAPI()


class AnalyzeRequest(BaseModel):
    extracted_text: str


class ChatRequest(BaseModel):
    question: str


@app.get("/")
async def root():
    return {"message": "AI server is running"}


@app.post("/api/ocr")
async def ocr_pdf_file(file: UploadFile = File(...)):
    if not file.filename.lower().endswith((".pdf", ".jpg", ".jpeg", ".png", ".txt")):
        raise HTTPException(status_code=400, detail="지원하지 않는 파일 형식입니다.")

    temp_dir = "temp_files"
    os.makedirs(temp_dir, exist_ok=True)
    file_location = os.path.join(temp_dir, file.filename)

    try:
        with open(file_location, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        extracted_text = extract_text_from_pdf(file_location)
        return JSONResponse(content={"text": extracted_text})

    except Exception as e:
        print(f"❌ OCR 처리 중 에러 발생: {e}")
        raise HTTPException(status_code=500, detail=f"OCR 서버 오류: {str(e)}")

    finally:
        if os.path.exists(file_location):
            os.remove(file_location)


@app.post("/api/ai-analyze")
async def analyze_text(request: AnalyzeRequest):
    try:
        ai_result = analyze_contract(request.extracted_text)
        return JSONResponse(content=ai_result)

    except Exception as e:
        print(f"❌ AI 분석 중 에러 발생: {e}")
        raise HTTPException(status_code=500, detail=f"AI 분석 서버 오류: {str(e)}")


@app.post("/api/chat")
async def chat_api(request: ChatRequest):
    try:
        answer = answer_chat(request.question)
        return JSONResponse(content={"answer": answer})

    except Exception as e:
        print(f"❌ 챗봇 응답 중 에러 발생: {e}")
        raise HTTPException(status_code=500, detail=f"챗봇 서버 오류: {str(e)}")