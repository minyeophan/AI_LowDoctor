import express from "express";
import { getAnalysisResult } from "../controllers/result_controller.js";

const router = express.Router();

router.get("/result/:documentId", getAnalysisResult);

export default router;