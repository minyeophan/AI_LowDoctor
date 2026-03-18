import express from "express";

import { uploadPost, updatePost } from "../controllers/post_controller.js";

const router = express.Router();

router.post('/', uploadPost);
router.patch('/:id', updatePost);

export default router;