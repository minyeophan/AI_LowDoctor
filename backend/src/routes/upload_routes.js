// backend/src/routes/upload_routes.js
import express from "express";
import { uploadFile } from "../controllers/upload_controller.js";
import upload from "../middleware/upload_multer.js";

const router = express.Router();

/**
 * @swagger
 * /api/upload:
 *   post:
 *     summary: 계약서 파일 업로드
 *     description: PDF 또는 이미지 파일을 업로드합니다
 *     tags: [Upload]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: 계약서 파일 (PDF, JPG, PNG)
 *     responses:
 *       200:
 *         description: 파일 업로드 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 document_id:
 *                   type: string
 *                   example: "uuid-1234"
 *                 status:
 *                   type: string
 *                   example: "uploaded"
 *       400:
 *         description: 파일이 없거나 잘못된 요청
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "error"
 *                 error_code:
 *                   type: string
 *                   example: "NO_FILE"
 *                 message:
 *                   type: string
 *                   example: "파일이 업로드되지 않았습니다"
 *       500:
 *         description: 서버 에러
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "error"
 *                 error_code:
 *                   type: string
 *                   example: "UPLOAD_FAILED"
 *                 message:
 *                   type: string
 *                   example: "파일 업로드 실패"
 */
router.post("/upload", upload.single("file"), uploadFile);

export default router;