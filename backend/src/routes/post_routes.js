import express from "express";

import { uploadPost, updatePost, deletePost } from "../controllers/post_controller.js";

const router = express.Router();

router.post('/', uploadPost);
router.patch('/:id', updatePost);
router.delete('/:id', deletePost);
router.post('/:id/like', likePost);

export default router;