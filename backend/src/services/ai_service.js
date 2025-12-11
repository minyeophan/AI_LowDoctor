// backend/src/services/ai_service.js
import axios from "axios";
import FormData from "form-data";
import fs from "fs";

const AI_SERVER_URL = process.env.AI_SERVER_URL || "http://localhost:8000";

/**
 * 1단계: OCR로 텍스트 추출 (필수!)
 * @param {string} filePath - 업로드된 파일 경로
 * @returns {Promise<string>} 추출된 텍스트
 */
export const extractText = async (filePath) => {
  try {
    console.log(`📄 OCR 텍스트 추출 중: ${filePath}`);

    const formData = new FormData();
    formData.append("file", fs.createReadStream(filePath));

    // AI 서버의 OCR 엔드포인트 호출
    const response = await axios.post(
      `${AI_SERVER_URL}/api/ocr`,
      formData,
      {
        headers: {
          ...formData.getHeaders(),
        },
        timeout: 60000, // 1분
      }
    );

    console.log("✅ OCR 추출 완료");
    
    // AI 서버 응답 형식: { text: "추출된 텍스트..." }
    return response.data.text;

  } catch (error) {
    console.error("❌ OCR 에러:", error.message);
    
    if (error.response) {
      throw new Error(`OCR 실패: ${error.response.data.message || error.message}`);
    } else if (error.request) {
      throw new Error("OCR 서버 응답 없음. AI 서버가 실행 중인지 확인하세요.");
    } else {
      throw new Error(`OCR 요청 설정 에러: ${error.message}`);
    }
  }
};

/**
 * 2단계: OCR 결과를 기반으로 AI 분석
 * @param {string} extractedText - OCR로 추출된 텍스트
 * @returns {Promise<Object>} AI 분석 결과
 */
export const analyzeWithExtractedText = async (extractedText) => {
  try {
    console.log(`🤖 AI 분석 시작 (텍스트 길이: ${extractedText.length}자)`);

    // AI 서버로 텍스트 전송
    const response = await axios.post(
      `${AI_SERVER_URL}/api/ai-analyze`,
      {
        extracted_text: extractedText  // OCR 결과를 JSON으로 전송
      },
      {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 120000, // 2분
      }
    );

    console.log("✅ AI 분석 완료");
    console.log("🔍 AI 응답:", JSON.stringify(response.data, null, 2));
    
    // 이 부분 수정함
  const aiData = response.data;

    return {
      summary: aiData.summary ? [{ title: "핵심 요약", content: aiData.summary }] : [],
      riskItems: (aiData.riskItems || []).map((item, index) => ({
        id: item.id || index + 1,
        clauseText: item.excerpt || "",
        searchKeyword: item.searchKeyword,
        riskLevel: (item.risk_level || "low").toLowerCase(),
        reason: item.reason || "",
        guide: item.suggested_fix || "",
      })),
      forms: aiData.forms || [],

    };

  } catch (error) {
    console.error("❌ AI 분석 에러:", error.message);
    
    if (error.response) {
      throw new Error(`AI 분석 실패: ${error.response.data.message || error.message}`);
    } else if (error.request) {
      throw new Error("AI 서버 응답 없음. 서버가 실행 중인지 확인하세요.");
    } else {
      throw new Error(`AI 분석 요청 설정 에러: ${error.message}`);
    }
  }
};

/**
 * (선택) 파일을 직접 전송해서 OCR + AI 한 번에 처리
 * 백엔드에서는 순차 처리 방식을 권장하지만,
 * AI 팀이 통합 엔드포인트를 제공할 경우 사용 가능
 */
export const analyzeDocumentDirect = async (filePath) => {
  try {
    console.log(`🤖 AI 서버로 파일 전송 및 전체 분석 요청: ${filePath}`);

    const formData = new FormData();
    formData.append("file", fs.createReadStream(filePath));

    // AI 서버의 통합 분석 엔드포인트
    const response = await axios.post(
      `${AI_SERVER_URL}/api/analyze-file`,
      formData,
      {
        headers: {
          ...formData.getHeaders(),
        },
        timeout: 180000, // 3분
      }
    );

    console.log("✅ 전체 분석 완료");
    
    // AI 서버 응답 형식:
    // {
    //   extractedText: "OCR 결과...",
    //   summary: "요약...",
    //   riskItems: [...],
    //   forms: [...]
    // }
    return response.data;

  } catch (error) {
    console.error("❌ 전체 분석 에러:", error.message);
    
    if (error.response) {
      throw new Error(`분석 실패: ${error.response.data.message || error.message}`);
    } else if (error.request) {
      throw new Error("AI 서버 응답 없음. 서버가 실행 중인지 확인하세요.");
    } else {
      throw new Error(`분석 요청 설정 에러: ${error.message}`);
    }
  }
};
