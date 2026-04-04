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
  getPostComments,
  createComment,
  toggleCommentLike,
} from "../controllers/post_controller.js";

const router = express.Router();

router.get("/", getPosts);
router.get("/best", getBestPost);
router.get("/:id", getPostDetail);

router.post("/", authMiddleware, createPost);
router.post("/upload", authMiddleware, uploadPost);
router.patch("/:id", authMiddleware, updatePost);
router.delete("/:id", authMiddleware, deletePost);
router.post("/:id/like", authMiddleware, togglePostLike);

router.get("/:id/comments", getPostComments);
router.post("/:id/comments", authMiddleware, createComment);
router.post("/comments/:commentId/like", authMiddleware, toggleCommentLike);

export default router;