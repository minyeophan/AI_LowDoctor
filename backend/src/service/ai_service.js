import axios from "axios";
import FormData from "form-data";
import fs from "fs";

const AI_SERVER_URL = process.env.AI_SERVER_URL || "http://localhost:8000";

/**
 * OCR + AI 분석 통합
 * @param {string} filePath 업로드된 파일 경로
 * @returns {Promise<{extractedText: string, summary: any[], riskItems: any[], forms: any[]}>}
 */
export const analyzeDocument = async (filePath) => {
  try {
    const formData = new FormData();
    formData.append('file', fs.createReadStream(filePath));

    console.log("OCR 추출 요청 중...");
    const ocrResponse = await axios.post(
      `${AI_SERVER_URL}/api/ocr`,
      formData,
      { headers: formData.getHeaders(), timeout: 60000 }
    );
    const extractedText = ocrResponse.data.text;
    console.log("OCR 완료");

    console.log("AI 분석 요청 중...");
    const aiResponse = await axios.post(
      `${AI_SERVER_URL}/api/ai-analyze`,
      { extracted_text: extractedText },
      { headers: { "Content-Type": "application/json" }, timeout: 120000 }
    );
    const aiData = aiResponse.data;
    console.log("AI 분석 완료");

    return {
      extractedText,
      summary: aiData.summary || [],
      riskItems: aiData.riskItems || [],
      forms: aiData.forms || [],
    };

  } catch (error) {
    console.error('OCR/AI 분석 에러:', error);
    throw new Error(`AI 분석 실패: ${error}`);
  }
};