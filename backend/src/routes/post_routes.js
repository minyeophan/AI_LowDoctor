import express from "express";
import authMiddleware from "../middleware/auth_middle.js";
import {
  createPost,
  uploadPost,
  getPosts,
  getBestPost,
  getPostDetail,
  updatePost,
  deletePost,
  togglePostLike,
} from "../controllers/post_controller.js";

const router = express.Router();

// 게시글 조회
router.get("/", getPosts);
router.get("/best", getBestPost);
router.get("/:id", getPostDetail);

// 게시글 작성/수정/삭제/좋아요
router.post("/", authMiddleware, createPost);

// 기존 이름 호환용
router.post("/upload", authMiddleware, uploadPost);

router.patch("/:id", authMiddleware, updatePost);
router.delete("/:id", authMiddleware, deletePost);
router.post("/:id/like", authMiddleware, togglePostLike);

export default router;