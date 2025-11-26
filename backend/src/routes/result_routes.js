// backend/src/routes/result_routes.js
import express from "express";
import { analyzeAndGetResult, getAllResults } from "../controllers/result_controller.js";

const router = express.Router();

/**
 * @swagger
 * /api/result/{id}:
 *   get:
 *     summary: 업로드된 문서를 AI 분석 후 결과 조회
 *     description: 문서 ID를 기준으로 AI 분석 결과를 조회합니다
 *     tags: [Result]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 문서 ID
 *     responses:
 *       200:
 *         description: 분석 완료 결과
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 message:
 *                   type: string
 *                   example: 분석 완료
 *                 data:
 *                   type: object
 *                   properties:
 *                     documentId:
 *                       type: string
 *                     summary:
 *                       type: string
 *                     riskItems:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: number
 *                           clauseText:
 *                             type: string
 *                           riskLevel:
 *                             type: string
 *                             enum: [high, medium, low]
 *                           reason:
 *                             type: string
 *                           lawRefs:
 *                             type: array
 *                             items:
 *                               type: object
 *                               properties:
 *                                 name:
 *                                   type: string
 *                                 article:
 *                                   type: string
 *                                 url:
 *                                   type: string
 *                           guide:
 *                             type: string
 *                     forms:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           type:
 *                             type: string
 *                           description:
 *                             type: string
 *                           downloadUrl:
 *                             type: string
 *       202:
 *         description: 분석 진행 중
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: processing
 *                 message:
 *                   type: string
 *                   example: 분석 진행 중
 *                 document_id:
 *                   type: string
 *       400:
 *         description: 분석 실패
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: error
 *                 error_code:
 *                   type: string
 *                   example: ANALYSIS_FAILED
 *                 message:
 *                   type: string
 *                   example: 분석 중 오류가 발생했습니다
 */
router.get("/result/:id", analyzeAndGetResult);

/**
 * @swagger
 * /api/results:
 *   get:
 *     summary: 모든 분석 결과 조회
 *     description: 필터(status), 페이지(page), 페이지당 제한(limit) 가능
 *     tags: [Result]
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [uploaded, processing, completed, failed]
 *         description: 상태 필터
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: 페이지 번호
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: 페이지당 항목 수
 *     responses:
 *       200:
 *         description: 분석 목록 조회 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: object
 *                   properties:
 *                     analyses:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           documentId:
 *                             type: string
 *                           filename:
 *                             type: string
 *                           status:
 *                             type: string
 *                           createdAt:
 *                             type: string
 *                           updatedAt:
 *                             type: string
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         total:
 *                           type: integer
 *                         page:
 *                           type: integer
 *                         limit:
 *                           type: integer
 *                         totalPages:
 *                           type: integer
 */
router.get("/results", getAllResults);

export default router;
