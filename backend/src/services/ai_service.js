// backend/src/services/ai_service.js
import axios from "axios";
import FormData from "form-data";
import fs from "fs";

const AI_SERVER_URL = process.env.AI_SERVER_URL || "http://localhost:8000";

/**
 * AI 서버에 파일 전송 및 분석 요청
 * @param {string} filePath - 업로드된 파일 경로
 * @returns {Promise<Object>} AI 분석 결과
 */
export const analyzeDocument = async (filePath) => {
  try {
    console.log(`🤖 AI 서버로 분석 요청 중: ${filePath}`);

    // FormData로 파일 전송 준비
    const formData = new FormData();
    formData.append("file", fs.createReadStream(filePath));

    // AI 서버로 POST 요청 (FastAPI)
    const response = await axios.post(
      `${AI_SERVER_URL}/api/analyze`,
      formData,
      {
        headers: {
          ...formData.getHeaders(),
        },
        timeout: 60000, // 60초 타임아웃
      }
    );

    console.log("✅ AI 분석 완료");
    return response.data;

  } catch (error) {
    console.error("❌ AI 서버 통신 에러:", error.message);
    
    if (error.response) {
      // AI 서버에서 에러 응답을 받은 경우
      throw new Error(`AI 분석 실패: ${error.response.data.message || error.message}`);
    } else if (error.request) {
      // 요청은 보냈지만 응답을 받지 못한 경우
      throw new Error("AI 서버 응답 없음. 서버가 실행 중인지 확인하세요.");
    } else {
      // 요청 설정 중 에러가 발생한 경우
      throw new Error(`요청 설정 에러: ${error.message}`);
    }
  }
};

/**
 * OCR 전용 요청 (텍스트 추출만)
 * @param {string} filePath - 업로드된 파일 경로
 * @returns {Promise<string>} 추출된 텍스트
 */
export const extractText = async (filePath) => {
  try {
    console.log(`📄 OCR 텍스트 추출 중: ${filePath}`);

    const formData = new FormData();
    formData.append("file", fs.createReadStream(filePath));

    const response = await axios.post(
      `${AI_SERVER_URL}/api/ocr`,
      formData,
      {
        headers: {
          ...formData.getHeaders(),
        },
        timeout: 30000, // 30초 타임아웃
      }
    );

    console.log("✅ OCR 추출 완료");
    return response.data.text;

  } catch (error) {
    console.error("❌ OCR 에러:", error.message);
    throw new Error(`OCR 실패: ${error.message}`);
  }
};