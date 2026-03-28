import express from "express";
import { getMyPageList } from "../controllers/mypage_controller";

const router = express.Router();

router.get('/mypage', getMyPageList);

export default router;