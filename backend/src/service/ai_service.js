import axios from "axios";
import FormData from "form-data";
import fs from "fs";

const AI_SERVER_URL = process.env.AI_SERVER_URL || "http://localhost:8000";

/**
 * OCR + AI 분석 통합
 * @param {string} filePath 업로드된 파일 경로
 * @returns {Promise<{extractedText: string, summary: any[], riskItems: any[]}>}
 */
const getAnalysisInstruction = () => `
계약서 본문을 분석하여 반드시 다음 JSON 형식으로만 응답하세요. 다른 설명은 생략하십시오.

{
  "summary": [
    {"title": "계약 당사자 및 목적물", "content": "내용 요약"},
    {"title": "보증금 및 월차임", "content": "내용 요약"},
    {"title": "임대차 기간", "content": "내용 요약"},
    {"title": "관리비 분담", "content": "내용 요약"},
    {"title": "상가 원상복구 범위", "content": "내용 요약"},
    {"title": "주택 원상복구 범위", "content": "내용 요약"},
    {"title": "전입신고 및 확정일자", "content": "내용 요약"},
    {"title": "담보권 설정금지 및 특약", "content": "내용 요약"}
  ],
  "riskItems": [],
  "forms": [],
  "contractTip": "계약 시 주의할 점 한줄 팁",
  "improvementGuides": []
}
`;

export const analyzeDocument = async (filePath) => {
  try {
    const formData = new FormData();
    formData.append("file", fs.createReadStream(filePath));

    console.log("OCR 추출 요청 중...");
    const ocrResponse = await axios.post(
      `${AI_SERVER_URL}/api/ocr`,
      formData,
      {
        headers: formData.getHeaders(),
        timeout: 60000,
      }
    );

    const extractedText = ocrResponse.data.text;
    console.log("OCR 완료");

    console.log("AI 통합 분석 요청 중 (속도 최적화)...");
    const aiResponse = await axios.post(
      `${AI_SERVER_URL}/api/ai-analyze`,
      {
        extracted_text: `[계약서 본문]\n${extractedText}\n\n[지시사항]\n${getAnalysisInstruction()}`,
      },
      {
        headers: { "Content-Type": "application/json" },
        timeout: 600000,
      }
    );

    let aiData = aiResponse.data;

    // AI 응답이 문자열로 올 경우를 대비한 파싱
    if (typeof aiData === "string") {
      try {
        aiData = JSON.parse(aiData);
      } catch (e) {
        console.error("JSON 파싱 실패, 원본 데이터를 사용합니다.");
      }
    }

    console.log("AI 분석 완료");

    return {
      extractedText,
      summary: aiData.summary || [],
      riskItems: aiData.riskItems || [],
      forms: aiData.forms || [],
      contractTip:
        typeof aiData.contractTip === "string"
          ? { content: aiData.contractTip }
          : aiData.contractTip || null,
      improvementGuides: aiData.improvementGuides || [],
    };
  } catch (error) {
    console.error("OCR/AI 분석 에러:", error);
    throw new Error(`AI 분석 실패: ${error.message}`);
  }
};

export const analyzeDocumentFromText = async (html) => {
  try {
    const text = html
      .replace(/<tr[^>]*>/gi, "\n")
      .replace(/<\/tr>/gi, "")
      .replace(/<td[^>]*>|<th[^>]*>/gi, "\t")
      .replace(/<\/td>|<\/th>/gi, "")
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<[^>]+>/g, "")
      .replace(/\t{2,}/g, "\t")
      .replace(/\n{3,}/g, "\n\n")
      .trim();

    console.log("에디터 텍스트로 AI 통합 분석 요청 중...");

    const aiResponse = await axios.post(
      `${AI_SERVER_URL}/api/ai-analyze`,
      {
        extracted_text: `[본문]\n${text}\n\n[지시사항]\n${getAnalysisInstruction()}`,
      },
      {
        headers: { "Content-Type": "application/json" },
        timeout: 120000,
      }
    );

    let aiData = aiResponse.data;

    if (typeof aiData === "string") {
      try {
        aiData = JSON.parse(aiData);
      } catch (e) {
        console.error("JSON 파싱 실패, 원본 데이터를 사용합니다.");
      }
    }

    console.log("AI 분석 완료");

    return {
      extractedText: text,
      summary: aiData.summary || [],
      riskItems: aiData.riskItems || [],
      forms: aiData.forms || [],
      contractTip:
        typeof aiData.contractTip === "string"
          ? { content: aiData.contractTip }
          : aiData.contractTip || null,
      improvementGuides: aiData.improvementGuides || [],
    };
  } catch (error) {
    console.error("에디터 텍스트 AI 분석 에러:", error);
    throw new Error(`AI 분석 실패: ${error.message}`);
  }
};

/**
 * 챗봇 질문 요청
 *
 * 기존 OCR/AI 문서 분석 기능은 그대로 유지하고,
 * 챗봇 요청에서만 사용하는 함수다.
 *
 * @param {string} question 사용자 질문 또는 이전 대화 맥락이 포함된 질문
 * @param {string} currentPath 현재 프론트 경로
 * @param {string} documentText 업로드 문서에서 질문과 관련 있는 일부 텍스트
 * @returns {Promise<string>} 챗봇 답변
 */
export const askChatbot = async (
  question,
  currentPath = "",
  documentText = ""
) => {
  try {
    const response = await axios.post(
      `${AI_SERVER_URL}/api/chat`,
      {
        question,
        currentPath,
        documentText,
      },
      {
        headers: { "Content-Type": "application/json" },
        timeout: 30000,
      }
    );

    return response.data?.answer || "응답이 없습니다.";
  } catch (error) {
    console.error(
      "챗봇 AI 서버 요청 에러:",
      error.response?.data || error.message
    );

    const status = error.response?.status || 500;

    const detail =
      error.response?.data?.detail ||
      error.response?.data?.message ||
      error.message ||
      "AI 서버 요청에 실패했습니다.";

    const customError = new Error(detail);
    customError.status = status;

    throw customError;
  }
};