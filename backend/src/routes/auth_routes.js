import express from "express";
import {
  signup,
  login,
  logout,
  getMe,
} from "../controllers/auth_controller.js";
import authMiddleware from "../middleware/auth_middle.js";

const router = express.Router();

router.post("/auth/signup", signup);
router.post("/auth/login", login);
router.post("/auth/logout", logout);
router.get("/auth/me", authMiddleware, getMe);

export default router;