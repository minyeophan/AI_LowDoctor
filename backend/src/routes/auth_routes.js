import express from "express";
import {
  signup,
  login,
  logout,
  getMe,
} from "../controllers/auth_controller.js";
import authMiddleware from "../middleware/auth_middle.js";
import { googleAuth, googleAuthCallback, googleAuthSuccess } from "../controllers/googleauth_controller.js";

const router = express.Router();

router.post("/signup", signup);
router.post("/login", login);
router.get("/google", googleAuth);
router.get("/google/callback", googleAuthCallback, googleAuthSuccess);
router.post("/logout", logout);
router.get("/me", authMiddleware, getMe);

export default router;