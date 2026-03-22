import express from "express";

import { uploadPost, updatePost, deletePost, viewsPost, categoryPost, likePost } from "../controllers/post_controller.js";

const router = express.Router();

router.post('/', uploadPost);
router.patch('/:id', updatePost);
router.delete('/:id', deletePost);
router.post('/:id/like', likePost);
router.get('/', categoryPost);
router.get('/:id', viewsPost);

export default router;