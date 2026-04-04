import express from "express";
import authMiddleware from "../middleware/auth_middle.js";
import { getMyPageList } from "../controllers/mypage_controller.js";

const router = express.Router();

router.get('/', authMiddleware, getMyPageList);

export default router;