import express from "express";
import authMiddleware from "../middleware/auth_middle.js";
import {
  getMyPageList,
  saveDocumentToArchive,
  getMyCommunityArchive,
  deleteMyCommunityArchive,
} from "../controllers/mypage_controller.js";

const router = express.Router();

router.get("/", authMiddleware, getMyPageList);
router.post("/save", authMiddleware, saveDocumentToArchive);

// 커뮤니티 보관함 조회
router.get("/community", authMiddleware, getMyCommunityArchive);

// 커뮤니티 보관함 삭제/좋아요 취소
router.post("/community/delete", authMiddleware, deleteMyCommunityArchive);

export default router;