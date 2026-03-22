import express from "express";

import { uploadComment, updateComment, deleteComment, likeComment, categoryComment } from "../controllers/comment_controller";

const router = express.Router();

router.post('/', uploadComment);
router.patch('/:id', updateComment);
router.delete('/:id', deleteComment);
router.post('/:id/like', likeComment);
router.get('/', categoryComment);

export default router;