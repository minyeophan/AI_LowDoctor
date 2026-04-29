import express from "express";
import authMiddleware from "../middleware/auth_middle.js";
import { getMyPageList, saveDocumentToArchive } from "../controllers/mypage_controller.js";

const router = express.Router();

router.get('/', authMiddleware, getMyPageList);
router.post('/save', authMiddleware, saveDocumentToArchive);

export default router;