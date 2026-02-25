import Result from "../schemas/result_db.js";
import Analysis from "../schemas/analyze_db.js";

export const getAnalysisResult = async (req, res, next) => {
  try {
    const { documentId } = req.params;

    if (!documentId || documentId === "undefined") {
      return res.status(400).json({ message: "documentId가 전달되지 않았습니다." });
    }

    const analysis = await Analysis.findOne({ documentId });
    const result = await Result.findOne({ documentId });

    if (!analysis) {
      return res.status(404).json({ message: "분석 기록이 존재하지 않습니다." });
    }

    res.status(200).json({
      documentId,
      status: analysis.status,
      extractedText: analysis.extractedText || "",
      content: analysis.extractedText || "",
      summary: result?.summary || [],
      riskItems: result?.riskItems || [],
      forms: result?.forms || [],
      errorMessage: analysis.errorMessage || null,
      createdAt: analysis.createdAt,
      updatedAt: analysis.updatedAt
    });

  } catch (error) {
    console.error("결과 조회 에러:", error);
    next(error);
  }
};