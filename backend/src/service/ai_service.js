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
 * 챗봇 답변 생성 요청
 *
 * 프론트에서 question만 보낸 경우,
 * 백엔드가 Python AI 서버 /api/chat으로 질문을 전달해 답변을 생성한다.
 *
 * documentText는 전달하지 않는다.
 * 따라서 업로드 문서 원문을 챗봇이 직접 읽어 답변하는 구조는 연결하지 않는다.
 */
export const askChatbot = async ({ question, currentPath }) => {
  try {
    const response = await axios.post(
      `${AI_SERVER_URL}/api/chat`,
      {
        question,
        currentPath,
      },
      {
        headers: { "Content-Type": "application/json" },
        timeout: 120000,
      }
    );

    return response.data?.answer || "";
  } catch (error) {
    console.error(
      "챗봇 AI 서버 호출 에러:",
      error.response?.data || error.message
    );

    throw new Error(`챗봇 답변 생성 실패: ${error.message}`);
  }
};