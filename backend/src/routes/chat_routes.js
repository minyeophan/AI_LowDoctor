import express from "express";
import axios from "axios";

const router = express.Router();
<<<<<<< HEAD
const AI_SERVER_URL = process.env.AI_SERVER_URL || "http://localhost:8000";

router.post("/chat", async (req, res, next) => {
  try {
    const { question } = req.body;

    if (!question || typeof question !== "string") {
      return res.status(400).json({
        success: false,
        message: "question 값이 필요합니다.",
      });
    }

    const response = await axios.post(
      `${AI_SERVER_URL}/api/chat`,
      { question },
      {
        headers: { "Content-Type": "application/json" },
        timeout: 120000,
      }
    );

    return res.json({
      success: true,
      answer: response.data.answer,
      references: response.data.references || {},
    });
  } catch (error) {
    console.error("❌ /api/chat 오류:", error?.response?.data || error.message);
    next(error);
=======
const AI_SERVER_URL = process.env.AI_SERVER_URL || "http://ai:8000";

router.post("/chat", async (req, res) => {
  try {
    const response = await axios.post(`${AI_SERVER_URL}/api/chat`, req.body, {
      headers: { "Content-Type": "application/json" },
      timeout: 120000,
    });

    res.json(response.data);
  } catch (error) {
    console.error("챗봇 요청 오류:", error.response?.data || error.message);
    res.status(500).json({
      message: "챗봇 요청 중 오류가 발생했습니다.",
      detail: error.response?.data || error.message,
    });
>>>>>>> 993fa18 (feat: 챗봇 RAG 검색 및 법령/용어/지식베이스 연동 구현)
  }
});

export default router;