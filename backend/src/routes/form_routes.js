import express from "express";
import authMiddleware from "../middleware/auth_middle.js";
import {
    getForms,
    downloadForm
} from "../controllers/form_controller.js";

const router = express.Router();

router.get("/", getForms);
router.get("/download/:id", authMiddleware, downloadForm);

export default router;