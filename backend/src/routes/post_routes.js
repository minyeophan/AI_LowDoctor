import express from "express";

import { uploadPost, updatePost, deletePost, viewsPost, categoryPost, likePost } from "../controllers/post_controller.js";
import isLoggedIn from "../middleware/auth_middle.js";

const router = express.Router();

router.post('/', isLoggedIn, uploadPost);
router.patch('/:id', isLoggedIn, updatePost);
router.delete('/:id', isLoggedIn, deletePost);
router.post('/:id/like', isLoggedIn, likePost);
router.get('/', categoryPost);
router.get('/:id', viewsPost);

export default router;