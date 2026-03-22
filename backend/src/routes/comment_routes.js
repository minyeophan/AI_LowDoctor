import express from "express";

import { uploadComment, updateComment, deleteComment, likeComment } from "../controllers/comment_controller";

const router = express.Router();

router.post('/', uploadComment);
router.patch('/:id', updateComment);
router.delete('/:id', deleteComment);
router.post('/:id/like', likeComment);

export default router;