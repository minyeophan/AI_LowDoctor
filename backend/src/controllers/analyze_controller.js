import Upload from "../schemas/upload_db.js";
import Analysis from "../schemas/analyze_db.js";
import Result from "../schemas/result_db.js";
import { analyzeDocument, analyzeDocumentFromText } from "../service/ai_service.js";

// 기존 함수 유지
export const startAnalysis = async (documentId) => {
  try {
    const currentDocument = await Upload.findOne({ documentId });

    if (!currentDocument) {
      await Analysis.updateOne(
        { documentId },
        { status: "failed", errorMessage: "업로드된 문서를 찾을 수 없습니다." }
      );
      return;
    }

    await Analysis.updateOne(
      { documentId },
      { status: "processing", progress: 20, errorMessage: null },
      { upsert: true }
    );

    const resultData = await analyzeDocument(currentDocument.filePath);

    const safeSummary = Array.isArray(resultData.summary)
      ? JSON.stringify(resultData.summary)
      : resultData.summary || "";

    const safeRiskItems = Array.isArray(resultData.riskItems)
      ? resultData.riskItems
      : [];

    const safeImprovementGuides = Array.isArray(resultData.riskItems)
  ? resultData.riskItems.map((item, index) => ({
      id: index + 1,
      originalClause: item.clauseText || "",
      checkPoints: Array.isArray(item.checkPoints) ? item.checkPoints : [],
      improvedClause: item.improvedClause || "",
      riskLevel: item.riskLevel || "low",
    }))
  : [];

    await Analysis.updateOne(
      { documentId },
      {
        status: "completed",
        progress: 100,
        extractedText: resultData.extractedText || "",
        result: resultData,
      }
    );

    await Result.findOneAndUpdate(
      { documentId },
      {
        documentId,
        summary: safeSummary,
        riskItems: safeRiskItems,
        improvementGuides: safeImprovementGuides,
        contractTip: resultData.contractTip || null,

        // Hybrid 구조 핵심
        analysis: resultData,
        engine: resultData.engine || resultData.provider || "unknown",
        model: resultData.model || resultData.modelName || "",
        status: "done",
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
  } catch (error) {
    const errorMessage =
      error?.response?.status === 429
        ? "AI 분석 실패: 쿼터 초과"
        : error?.message || String(error);

    await Analysis.updateOne(
      { documentId },
      { status: "failed", errorMessage }
    );

    await Result.findOneAndUpdate(
      { documentId },
      {
        documentId,
        status: "failed",
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
  }
};

export const requestAnalysis = async (req, res, next) => {
  try {
    const { documentId } = req.body;

    const currentDocument = await Upload.findOne({ documentId });
    if (!currentDocument) {
      return res.status(404).json({ message: "업로드된 문서를 찾을 수 없습니다." });
    }

    const existing = await Analysis.findOne({ documentId });

    if (existing && existing.status === "processing") {
      return res.status(400).json({ message: "이미 분석 진행 중입니다. " });
    }

    const newAnalysis = await Analysis.findOneAndUpdate(
      { documentId },
      { status: "processing", errorMessage: null },
      { upsert: true, new: true }
    );

    res.status(200).json({
      message: "분석 요청 성공. 분석 진행 중...",
      analysisId: newAnalysis._id,
    });

    try {
      const resultData = req.body.editedText
        ? await analyzeDocumentFromText(req.body.editedText)
        : await analyzeDocument(currentDocument.filePath);

      const safeSummary = Array.isArray(resultData.summary)
        ? JSON.stringify(resultData.summary)
        : resultData.summary || "";

      const safeRiskItems = Array.isArray(resultData.riskItems)
        ? resultData.riskItems
        : [];

     const safeImprovementGuides = Array.isArray(resultData.riskItems)
      ? resultData.riskItems.map((item, index) => ({
          id: index + 1,
          originalClause: item.clauseText || "",
          checkPoints: Array.isArray(item.checkPoints) ? item.checkPoints : [],
          improvedClause: item.improvedClause || "",
          riskLevel: item.riskLevel || "low",
        }))
      : [];

      await Analysis.findOneAndUpdate(
        { documentId },
        {
          status: "completed",
          extractedText: resultData.extractedText || "",
          result: resultData,
        }
      );

      await Result.findOneAndUpdate(
        { documentId },
        {
          documentId,
          summary: safeSummary,
          riskItems: safeRiskItems,
          improvementGuides: safeImprovementGuides,
          contractTip: resultData.contractTip || null,

          // Hybrid 구조 핵심
          analysis: resultData,
          engine: resultData.engine || resultData.provider || "unknown",
          model: resultData.model || resultData.modelName || "",
          status: "done",
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );

      console.log(`전체 분석 완료 [${documentId}]`);
    } catch (err) {
      console.error(`분석 실패 [${documentId}]:`, err?.message || String(err));

      const errorMessage =
        err?.response?.status === 429
          ? "AI 분석 실패: 쿼터 초과"
          : err?.message || String(err);

      await Analysis.findOneAndUpdate(
        { documentId },
        { status: "failed", errorMessage },
        { new: true }
      );

      await Result.findOneAndUpdate(
        { documentId },
        {
          documentId,
          status: "failed",
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
    }
  } catch (err) {
    console.error(err);
    next(err);
  }
};