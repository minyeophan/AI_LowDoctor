import express from "express";
import { verifyToken } from "../middleware/auth_middle.js";
import { createToken, tokenTest, signup } from "../controllers/auth_controller.js";

const router = express.Router();

router.post('/signup', signup);                     // 회원가입
router.post('/login', createToken);             // 로그인 -> 토큰 발급
router.get('/test', verifyToken, tokenTest);

/**
 * @swagger
 * /api/auth/signup:
 *   post:
 *     summary: 회원가입
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userID:   { type: string }
 *               name:     { type: string }
 *               email:    { type: string }
 *               password: { type: string }
 *               role:     { type: string }
 *     responses:
 *       201:
 *         description: 회원가입 완료
 *       409:
 *         description: 이미 존재하는 이메일
 *
 * /api/auth/login:
 *   post:
 *     summary: 로그인 (토큰 발급)
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userID:   { type: string }
 *               password: { type: string }
 *     responses:
 *       200:
 *         description: 토큰 발급 성공
 *       401:
 *         description: 인증 실패
 *
 * /api/auth/test:
 *   get:
 *     summary: 토큰 인증 테스트
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 인증 성공
 *       401:
 *         description: 토큰 없음 또는 유효하지 않음
 *       419:
 *         description: 토큰 만료
 */

export default router;