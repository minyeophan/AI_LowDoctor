// backend/src/services/result_service.js
import { v4 as uuidv4 } from "uuid";
import { Analysis } from "../app.js"; // MongoDB 모델 import

/**
 * 분석 결과 DB 저장
 * @param {string} fileName - 업로드된 원본 파일명
 * @param {string} text - OCR로 추출된 텍스트
 * @param {Object} analysis - AI 분석 결과
 * @returns {Promise<Analysis>} 저장된 Analysis 객체 반환
 */
export const saveAnalysisResult = async (fileName, text, analysis) => {
  const documentId = uuidv4();

  const result = new Analysis({
    documentId,
    filename: fileName,
    originalname: fileName,
    filePath: "", // 실제 경로 필요하면 추가
    fileSize: 0, // 실제 용량 필요하면 추가
    mimetype: "", // 실제 MIME 필요하면 추가
    extractedText: text,
    summary: analysis.summary,
    riskItems: analysis.riskItems,
    forms: analysis.forms,
    status: "completed"
  });

  await result.save();

  return result;
};

/**
 * 문서 ID로 분석 결과 조회
 * @param {string} documentId
 * @returns {Promise<Analysis|null>}
 */
export const getResultById = async (documentId) => {
  return await Analysis.findOne({ documentId });
};
