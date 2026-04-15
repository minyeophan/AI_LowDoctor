import express from "express";

import { requestAnalysis } from "../controllers/analyze_controller.js";

const router = express.Router();

router.post('/analyze', requestAnalysis);

export default router;
