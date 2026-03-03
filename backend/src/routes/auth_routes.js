import express from "express";

import { verifyToken } from "../middleware";
import { createToken, tokenTest } from "../controllers/auth_controller";

const router = express.Router();

router.post('/token', createToken);

router.get('/test', verifyToken, tokenTest);

export default router;