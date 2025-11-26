// backend/src/routes/result_routes.js
import express from "express";
import { getResult, getAllResults, deleteResult } from "../controllers/result_controller.js";

const router = express.Router();

/**
 * @swagger
 * /api/result/{id}:
 *   get:
 *     summary: 분석 결과 조회
 *     description: document_id로 분석 결과를 조회합니다
 *     tags: [Result]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 문서 ID (document_id)
 *     responses:
 *       200:
 *         description: 분석 완료
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "success"
 *                 message:
 *                   type: string
 *                   example: "분석 완료"
 *                 data:
 *                   type: object
 *       202:
 *         description: 분석 진행 중
 *       404:
 *         description: 문서를 찾을 수 없음
 *       500:
 *         description: 분석 실패
 */
router.get("/result/:id", getResult);

/**
 * @swagger
 * /api/results:
 *   get:
 *     summary: 전체 분석 목록 조회
 *     description: 모든 분석 결과 목록을 조회합니다 (페이징 지원)
 *     tags: [Result]
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [uploaded, processing, completed, failed]
 *         description: 상태별 필터링
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: 페이지당 항목 수
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: 페이지 번호
 *     responses:
 *       200:
 *         description: 조회 성공
 */
router.get("/results", getAllResults);

/**
 * @swagger
 * /api/result/{id}:
 *   delete:
 *     summary: 분석 결과 삭제
 *     description: document_id로 분석 결과를 삭제합니다
 *     tags: [Result]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 문서 ID (document_id)
 *     responses:
 *       200:
 *         description: 삭제 성공
 *       404:
 *         description: 문서를 찾을 수 없음
 */
router.delete("/result/:id", deleteResult);

export default router;