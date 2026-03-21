import express from "express";

import { verifyToken } from "../middleware/auth_middle.js";
import { createToken } from "../controllers/auth_controller.js";

const router = express.Router();

router.post('/token', createToken);

export default router;