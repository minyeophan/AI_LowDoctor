import express from "express";
import {
  signup,
  login,
  logout,
  getMe,
} from "../controllers/auth_controller.js";
import authMiddleware from "../middleware/auth_middle.js";
import { googleAuth, googleAuthCallback, googleAuthSuccess } from "../controllers/googleauth_controller.js";
import { kakaoAuth, kakaoAuthCallback, kakaoAuthSuccess } from "../controllers/kakaoauth_controller.js";

const router = express.Router();

router.post("/signup", signup);
router.post("/login", login);
router.get("/google", googleAuth);
router.get("/google/callback", googleAuthCallback, googleAuthSuccess);
router.get("/kakao", kakaoAuth);
router.get("/kakao/callback", kakaoAuthCallback, kakaoAuthSuccess);
router.post("/logout", logout);
router.get("/me", authMiddleware, getMe);

// Swagger 테스트용 엔드포인트
router.get("/google/test", (req, res) => {
  res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?client_id=${process.env.GOOGLE_CLIENT_ID}&redirect_uri=${encodeURIComponent(process.env.GOOGLE_REDIRECT_URI)}&scope=profile%20email%20https://www.googleapis.com/auth/calendar&response_type=code&access_type=offline&prompt=consent`);
});
router.get("/kakao/test", (req, res) => {
  res.redirect(`https://kauth.kakao.com/oauth/authorize?client_id=${process.env.KAKAO_CLIENT_ID}&redirect_uri=${encodeURIComponent(process.env.KAKAO_REDIRECT_URI)}&response_type=code&scope=profile_nickname,profile_image,account_email,talk_message`);
});

export default router;