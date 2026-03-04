import { execFile } from "child_process";
import path from "path";

/**
 * Python analyzer를 실행하여 결과(JSON)를 가져옴
 */
export const analyzeWithPython = (filePath, mimetype) => {
  return new Promise((resolve, reject) => {
    const scriptPath = path.join("..","AI","analysis", "analyzer.py");

    console.log(`Python analyzer 실행: ${scriptPath}`);

    execFile(
      "python",
      [scriptPath, filePath, mimetype],
      { maxBuffer: 10 * 1024 * 1024 },
      (error, stdout, stderr) => {
        if (error) {
          console.error("Python 오류:", stderr);
          return reject(error);
        }

        console.log("Python 출력:", stdout);
        console.log("Python stdout raw:", stdout);

        try {
          const parsed = JSON.parse(stdout); // JSON 파싱
          resolve(parsed);
        } catch (err) {
          reject(new Error("Python 출력 JSON 파싱 실패"));
        }
      }
    );
  });
};

<<<<<<< HEAD
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
=======
// 기존 extractText 함수는 사용 안함
export const extractText = async () => {
  return "";
>>>>>>> origin/develop
};

// 기존 analyzeWithExtractedText 함수도 사용 안함
export const analyzeWithExtractedText = async () => {
  return {};
};
