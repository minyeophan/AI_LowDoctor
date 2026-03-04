import express from "express";
import { getAnalysisResult } from "../controllers/result_controller.js";

const router = express.Router();

/**
 * @swagger
 * /api/result/{documentId}:
 *   get:
 *     tags: [Document]
 *     summary: 분석 결과 조회
 *     parameters:
 *       - in: path
 *         name: documentId
 *         required: true
 *         schema:
 *           type: string
 *         description: 분석할 문서 ID
 *     responses:
 *       200:
 *         description: 분석 결과
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 summary:
 *                   type: array
 *                   items:
 *                     type: string
 *                 riskItems:
 *                   type: array
 *                   items:
 *                     type: string
 *                 recommendations:
 *                   type: array
 *                   items:
 *                     type: string
 *                 forms:
 *                   type: array
 *                   items:
 *                     type: string
 *                 analyzedAt:
 *                   type: string
 *                 contractTip:
 *                   type: object
 *                   properties:
 *                     docType:
 *                       type: string
 *                     title:
 *                       type: string
 *                     items:
 *                       type: array
 *                       items:
 *                         type: string
 *       400:
 *         description: 잘못된 요청
 */
router.get("/result/:documentId", getAnalysisResult);

export default router;