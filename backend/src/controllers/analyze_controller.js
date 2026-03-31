import Upload from "../schemas/upload_db.js";
import Analysis from "../schemas/analyze_db.js";
import Result from "../schemas/result_db.js";
import { analyzeDocument, analyzeDocumentFromText } from "../service/ai_service.js";

export const requestAnalysis = async (req, res, next) => {
  try {
    const { documentId } = req.body;

    const currentDocument = await Upload.findOne({ documentId });
    if (!currentDocument) {
      return res.status(404).json({ message: "업로드된 문서를 찾을 수 없습니다." });
    }

    const existing = await Analysis.findOne({ documentId });

    if (existing && existing.status === "processing") {
      return res.status(400).json({ message: "이미 분석 진행 중입니다. "});
    }

    const newAnalysis = await Analysis.findOneAndUpdate(
      { documentId},
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

      const safeForms = Array.isArray(resultData.forms)
        ? resultData.forms
        : [];

      const safeImprovementGuides = Array.isArray(resultData.riskItems)
        ? resultData.riskItems.map((item, index) => ({
            id: index + 1,
            originalClause: item.clauseText || '',
            checkPoints: Array.isArray(item.checkPoints) ? item.checkPoints : [],
            improvedClause: item.improvedClause || '',
          }))
        : [];

      await Analysis.findOneAndUpdate(
        { documentId: documentId },
        {
          status: "completed",
          extractedText: resultData.extractedText || "",
          result: resultData,
        },
      );

      await Result.findOneAndUpdate(
        { documentId: documentId },
        {
          summary: safeSummary,
          riskItems: safeRiskItems,
          forms: safeForms,
          improvementGuides: safeImprovementGuides,
          contractTip: resultData.contractTip || null,
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
