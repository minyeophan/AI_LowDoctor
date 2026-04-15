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
      { headers: { "Content-Type": "application/json" }, timeout: 600000 }
    );
    const aiData = aiResponse.data;
    console.log("AI 분석 완료");

    return {
      extractedText,
      summary: typeof aiData.summary === "string"
      ? [{ title: "핵심 요약", content: aiData.summary }]
      : aiData.summary || [],
      riskItems: aiData.riskItems || [],
      forms: aiData.forms || [],
      contractTip: aiData.contractTip || null,
      improvementGuides: aiData.improvementGuides || [],
    };

  } catch (error) {
    console.error('OCR/AI 분석 에러:', error);
    throw new Error(`AI 분석 실패: ${error}`);
  }
};

// 에디터에서 수정된 HTML 텍스트로 직접 분석 (OCR 단계 스킵)
export const analyzeDocumentFromText = async (html) => {
  // HTML 태그 제거하고 테이블 구조를 텍스트로 변환
  const text = html
    .replace(/<tr[^>]*>/gi, '\n')
    .replace(/<\/tr>/gi, '')
    .replace(/<td[^>]*>|<th[^>]*>/gi, '\t')
    .replace(/<\/td>|<\/th>/gi, '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/\t{2,}/g, '\t')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  console.log("에디터 텍스트로 AI 분석 요청 중...");
  const aiResponse = await axios.post(
    `${AI_SERVER_URL}/api/ai-analyze`,
    { extracted_text: text },
    { headers: { "Content-Type": "application/json" }, timeout: 120000 }
  );
  const aiData = aiResponse.data;
  console.log("AI 분석 완료");

  return {
    extractedText: text,
    summary: typeof aiData.summary === "string"
      ? [{ title: "핵심 요약", content: aiData.summary }]
      : aiData.summary || [],
    riskItems: aiData.riskItems || [],
    forms: aiData.forms || [],
    contractTip: aiData.contractTip || null,
    improvementGuides: aiData.improvementGuides || [],
  };
};
