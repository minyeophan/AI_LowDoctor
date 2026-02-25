import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";

import { afterUpload } from "../controllers/upload_controller.js";

const router = express.Router();

try {
    fs.readdirSync('uploads');
} catch (error) {
    console.error('uploads 폴더가 없어 uploads 폴더를 생성합니다.');
    fs.mkdirSync('uploads');
}

const upload = multer({
    storage: multer.diskStorage({
        destination(req, file, cb) {
            cb(null, 'uploads/');
        },
        filename(req, file, cb) {
            const originalname = Buffer.from(file.originalname, 'latin1').toString('utf8');
            const ext = path.extname(originalname);
            const basename = path.basename(originalname, ext);
            cb(null, basename + Date.now() + ext);
        },
    }),
    limits: { fileSize: 10 * 1024 * 1024 },
});

/**
 * @swagger
 * /api/upload:
 *   post:
 *     tags: [Document]
 *     summary: 파일 업로드
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
 *     responses:
 *       200:
 *         description: 업로드 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 document_id:
 *                   type: string
 *                 status:
 *                   type: string
 *                 content:
 *                   type: string
 */
router.post('/upload', upload.single('file'), afterUpload);

export default router;