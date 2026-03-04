import express from "express";

import { requestAnalysis } from "../controllers/analyze_controller.js";

const router = express.Router();

/**
 * @swagger
 * /api/analyze:
 *   post:
 *     tags: [Document]
 *     summary: 문서 분석 요청
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - documentId
 *             properties:
 *               documentId:
 *                 type: string
 *                 description: 업로드 후 받은 document_id
 *     responses:
 *       200:
 *         description: 분석 요청 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 analysisId:
 *                   type: string
 */
router.post('/analyze', requestAnalysis);

export default router;