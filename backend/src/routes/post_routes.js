import express from "express";

import { uploadPost } from "../controllers/post_controller.js";

const router = express.Router();

router.post('/', uploadPost);

export default router;