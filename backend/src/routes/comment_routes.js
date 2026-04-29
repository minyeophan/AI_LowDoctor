import express from "express";
import authMiddleware from "../middleware/auth_middle.js";
import {
  getPostComments,
  createComment,
  uploadComment,
  updateComment,
  deleteComment,
  likeComment,
} from "../controllers/comment_controller.js";

const router = express.Router();

/**
 * app.js에서 아래처럼 연결:
 * app.use("/api", commentRouter);
 *
 * 실제 경로:
 * GET    /api/posts/:id/comments
 * POST   /api/posts/:id/comments
 * PATCH  /api/comments/:id
 * DELETE /api/comments/:id
 * POST   /api/comments/:id/like
 */

// 특정 게시글 댓글 목록 조회 / 작성
router.get("/posts/:id/comments", getPostComments);
router.post("/posts/:id/comments", authMiddleware, createComment);

// 기존 이름 호환용
router.post("/posts/:id/comments/upload", authMiddleware, uploadComment);

// 댓글 수정 / 삭제 / 좋아요
router.patch("/comments/:id", authMiddleware, updateComment);
router.delete("/comments/:id", authMiddleware, deleteComment);
router.post("/comments/:id/like", authMiddleware, likeComment);

export default router;