// backend/src/controllers/upload_controller.js
import { v4 as uuidv4 } from "uuid";
import { Analysis } from "../app.js";
import { extractText, analyzeWithExtractedText } from "../services/ai_service.js";

/**
 * 파일 업로드 + 백그라운드 AI 분석
 */
export const uploadFile = async (req, res) => {
  try {
    const file = req.file;
    
    if (!file) {
      return res.status(400).json({
        status: "error",
        error_code: "NO_FILE",
        message: "파일이 업로드되지 않았습니다.",
      });
    }
    
    const documentId = uuidv4();

    console.log(`✅ File uploaded: ${file.originalname} (${file.size} bytes)`);
    console.log(`📄 Document ID: ${documentId}`);
    console.log(`📁 Path: ${file.path}`);

    // ========== MongoDB에 초기 정보 저장 ==========
    const analysis = new Analysis({
      documentId,
      filename: file.filename,
      originalname: file.originalname,
      filePath: file.path,
      fileSize: file.size,
      mimetype: file.mimetype,
      status: "uploaded"
    });

    await analysis.save();
    console.log("💾 DB 저장 완료");

    // ========== 즉시 응답 ==========
    res.status(200).json({
      document_id: documentId,
      status: "uploaded"
    });

    // ========== 백그라운드 AI 분석 시작 ==========
    processAnalysis(documentId, file.path).catch(error => {
      console.error(`❌ 분석 에러 [${documentId}]:`, error.message);
    });

  } catch (error) {
    console.error("❌ Upload error:", error);
    
    return res.status(400).json({
      status: "error",
      error_code: "UPLOAD_FAILED",
      message: "파일 업로드 실패",
    });
  }
};

/**
 * 백그라운드 AI 분석 (순차 처리)
 * 흐름: OCR → AI 분석 → DB 저장
 */
async function processAnalysis(documentId, filePath) {
  try {
    console.log(`🔄 분석 시작 [${documentId}]`);

    // 1. 상태 업데이트
    await Analysis.findOneAndUpdate(
      { documentId },
      { status: "processing" }
    );

    // 2-1. OCR로 텍스트 추출 (필수!)
    console.log(`📄 1단계: OCR 텍스트 추출 중...`);
    const extractedText = await extractText(filePath);
    console.log(`✅ OCR 완료 (${extractedText.length}자 추출)`);

    // 2-2. AI 분석 (OCR 결과를 기반으로)
    console.log(`🤖 2단계: AI 분석 중...`);
    const aiResult = await analyzeWithExtractedText(extractedText);
    console.log(`✅ AI 분석 완료`);

    // 3. 결과를 DB에 저장
    console.log(`💾 3단계: DB 저장 중...`);
    await Analysis.findOneAndUpdate(
      { documentId },
      {
        extractedText: extractedText,
        summary: aiResult.summary || "",
        riskItems: aiResult.riskItems || [],
        forms: aiResult.forms || [],
        status: "completed"
      }
    );

    console.log(`✅ 전체 분석 완료 [${documentId}]`);

  } catch (error) {
    console.error(`❌ 분석 실패 [${documentId}]:`, error.message);

    // 에러 상태 저장
    await Analysis.findOneAndUpdate(
      { documentId },
      {
        status: "failed",
        errorMessage: error.message
      }
    );
  }
}
