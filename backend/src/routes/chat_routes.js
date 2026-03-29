import express from "express";
import axios from "axios";

const router = express.Router();
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
  }
});

export default router;