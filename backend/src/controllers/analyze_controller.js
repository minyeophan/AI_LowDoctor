import Upload from "../schemas/upload_db.js";
import Analysis from "../schemas/analyze_db.js";
import Result from "../schemas/result_db.js";
import { analyzeDocument } from "../service/ai_service.js";

export const requestAnalysis = async (req, res, next) => {
  try {
    const { documentId } = req.body;

    const currentDocument = await Upload.findOne({ documentId });
    if (!currentDocument) {
      return res.status(404).json({ message: "업로드된 문서를 찾을 수 없습니다." });
    }

    const newAnalysis = await Analysis.create({
      documentId: documentId,
      status: "processing",
    });

    res.status(200).json({
      message: "분석 요청 성공. 분석 진행 중...",
      analysisId: newAnalysis._id,
    });

    try {
      const resultData = await analyzeDocument(currentDocument.filePath);

      const safeSummary = Array.isArray(resultData.summary)
        ? resultData.summary.join("\n")
        : resultData.summary || "";

      const safeRiskItems = Array.isArray(resultData.riskItems)
        ? resultData.riskItems
        : [];

      const safeForms = Array.isArray(resultData.forms)
        ? resultData.forms
        : [];

      await Analysis.findOneAndUpdate(
        { documentId: documentId },
        {
          status: "completed",
          extractedText: resultData.extractedText || "",
          summary: safeSummary,
          riskItems: safeRiskItems,
          forms: safeForms,
        },
        { returnDocument: "after" }
      );

      await Result.findOneAndUpdate(
        { documentId: documentId },
        {
          summary: safeSummary,
          riskItems: safeRiskItems,
          forms: safeForms,
        },
        { upsert: true, returnDocument: "after" }
      );

      console.log(`전체 분석 완료 [${documentId}]`);

    } catch (err) {
      console.error(`분석 실패 [${documentId}]:`, err?.message || String(err));

      const errorMessage =
        err?.response?.status === 429
          ? "AI 분석 실패: 쿼터 초과"
          : err?.message || String(err);

      await Analysis.findOneAndUpdate(
        { documentId: documentId },
        { status: "failed", errorMessage },
        { returnDocument: "after" }
      );
    }

  } catch (err) {
    console.error(err);
    next(err);
  }
};