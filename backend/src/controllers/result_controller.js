// backend/src/controllers/result_controller.js
import { Analysis } from "../app.js";

/**
 * 분석 결과 조회
 * GET /api/result/:id
 */
export const getResult = async (req, res) => {
  try {
    const { id } = req.params;

    console.log(`🔍 결과 조회 요청: ${id}`);

    // DB에서 문서 조회
    const analysis = await Analysis.findOne({ documentId: id });

    if (!analysis) {
      return res.status(404).json({
        status: "error",
        error_code: "NOT_FOUND",
        message: "해당 문서를 찾을 수 없습니다."
      });
    }

    // 상태에 따른 응답 처리
    if (analysis.status === "uploaded" || analysis.status === "processing") {
      return res.status(202).json({
        status: "processing",
        message: "분석이 진행 중입니다.",
        document_id: analysis.documentId,
        progress: analysis.status
      });
    }

    if (analysis.status === "failed") {
      return res.status(500).json({
        status: "error",
        error_code: "ANALYSIS_FAILED",
        message: analysis.errorMessage || "분석 중 오류가 발생했습니다."
      });
    }

    // 분석 완료 - 전체 결과 반환
    return res.status(200).json({
      status: "success",
      message: "분석 완료",
      data: {
        documentId: analysis.documentId,
        summary: analysis.summary,
        riskItems: analysis.riskItems,
        forms: analysis.forms,
        createdAt: analysis.createdAt,
        updatedAt: analysis.updatedAt
      }
    });

  } catch (error) {
    console.error("❌ 결과 조회 에러:", error);
    return res.status(500).json({
      status: "error",
      error_code: "SERVER_ERROR",
      message: "서버 오류가 발생했습니다."
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
    if (status) {
      query.status = status;
    }

    const skip = (page - 1) * limit;

    const analyses = await Analysis.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skip)
      .select('-extractedText'); // 텍스트는 용량이 크니 목록에서 제외

    const total = await Analysis.countDocuments(query);

    return res.status(200).json({
      status: "success",
      data: {
        analyses,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(total / limit)
        }
      }
    });

  } catch (error) {
    console.error("❌ 목록 조회 에러:", error);
    return res.status(500).json({
      status: "error",
      error_code: "SERVER_ERROR",
      message: "서버 오류가 발생했습니다."
    });
  }
};

/**
 * 분석 결과 삭제
 * DELETE /api/result/:id
 */
export const deleteResult = async (req, res) => {
  try {
    const { id } = req.params;

    const analysis = await Analysis.findOneAndDelete({ documentId: id });

    if (!analysis) {
      return res.status(404).json({
        status: "error",
        error_code: "NOT_FOUND",
        message: "해당 문서를 찾을 수 없습니다."
      });
    }

    // 파일도 삭제 (선택사항)
    // fs.unlinkSync(analysis.filePath);

    return res.status(200).json({
      status: "success",
      message: "문서가 삭제되었습니다."
    });

  } catch (error) {
    console.error("❌ 삭제 에러:", error);
    return res.status(500).json({
      status: "error",
      error_code: "SERVER_ERROR",
      message: "서버 오류가 발생했습니다."
    });
  }
};