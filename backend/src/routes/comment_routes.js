import express from "express";

import { uploadComment, updateComment, deleteComment, likeComment, categoryComment } from "../controllers/comment_controller.js";
import isLoggedIn from "../middleware/auth_middle.js";

const router = express.Router();

router.post('/', isLoggedIn, uploadComment);
router.patch('/:id', isLoggedIn, updateComment);
router.delete('/:id', isLoggedIn, deleteComment);
router.post('/:id/like', isLoggedIn, likeComment);
router.get('/', categoryComment);

export default router;