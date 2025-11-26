// backend/src/controllers/result_controller.js
import { Analysis } from "../app.js";
import { analyzeDocument } from "../services/ai_service.js";

/**
 * 단일 문서 분석 조회 및 생성
 * POST /api/result/:id
 * 업로드된 문서를 AI 분석 후 DB 저장, 결과 반환
 */
export const analyzeAndGetResult = async (req, res) => {
  try {
    const { id } = req.params;

    console.log(`📄 분석 요청: ${id}`);

    // 이미 DB에 존재하는 경우
    let analysis = await Analysis.findOne({ documentId: id });

    if (analysis) {
      if (analysis.status === "completed") {
        // 이미 분석 완료
        return res.status(200).json({
          status: "success",
          message: "분석 완료",
          data: {
            documentId: analysis.documentId,
            summary: analysis.summary,
            riskItems: analysis.riskItems,
            forms: analysis.forms,
            createdAt: analysis.createdAt,
            updatedAt: analysis.updatedAt,
          },
        });
      } else if (analysis.status === "processing" || analysis.status === "uploaded") {
        return res.status(202).json({
          status: "processing",
          message: "분석 진행 중",
          document_id: analysis.documentId,
          progress: analysis.status,
        });
      } else if (analysis.status === "failed") {
        return res.status(400).json({
          status: "error",
          error_code: "ANALYSIS_FAILED",
          message: analysis.errorMessage || "분석 실패",
        });
      }
    }

    // DB에 없으면 새로운 분석 기록 생성
    analysis = new Analysis({ documentId: id, status: "processing" });
    await analysis.save();

    // AI 서버에 분석 요청
    const aiResult = await analyzeDocument(analysis.filePath);

    // 분석 결과 DB 저장
    analysis.summary = aiResult.summary;
    analysis.riskItems = aiResult.riskItems;
    analysis.forms = aiResult.forms;
    analysis.status = "completed";
    await analysis.save();

    return res.status(200).json({
      status: "success",
      message: "분석 완료",
      data: {
        documentId: analysis.documentId,
        summary: analysis.summary,
        riskItems: analysis.riskItems,
        forms: analysis.forms,
        createdAt: analysis.createdAt,
        updatedAt: analysis.updatedAt,
      },
    });

  } catch (error) {
    console.error("❌ 분석 에러:", error);

    // DB 상태 업데이트
    if (id) {
      await Analysis.findOneAndUpdate(
        { documentId: id },
        { status: "failed", errorMessage: error.message }
      );
    }

    return res.status(500).json({
      status: "error",
      error_code: "SERVER_ERROR",
      message: error.message || "서버 오류가 발생했습니다.",
    });
  }
};

/**
 * 전체 분석 목록 조회
 * GET /api/results
 */
export const getAllResults = async (req, res) => {
  try {
    const { status, limit = 10, page = 1 } = req.query;

    const query = {};
    if (status) query.status = status;

    const skip = (page - 1) * limit;

    const analyses = await Analysis.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skip)
      .select('-extractedText'); // 텍스트 제외

    const total = await Analysis.countDocuments(query);

    return res.status(200).json({
      status: "success",
      data: {
        analyses,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(total / limit),
        },
      },
    });

  } catch (error) {
    console.error("❌ 목록 조회 에러:", error);
    return res.status(500).json({
      status: "error",
      error_code: "SERVER_ERROR",
      message: "서버 오류가 발생했습니다.",
    });
  }
};
