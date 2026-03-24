import express from "express";
import axios from "axios";

const router = express.Router();
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
  }
});

export default router;