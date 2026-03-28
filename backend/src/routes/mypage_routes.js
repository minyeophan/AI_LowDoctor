import express from "express";
import { getMyPageList } from "../controllers/mypage_controller.js";

const router = express.Router();

router.get('/', getMyPageList);

export default router;