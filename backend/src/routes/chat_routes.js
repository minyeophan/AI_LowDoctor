import express from "express";
import authMiddleware from "../middleware/auth_middle.js";
import {
  getChatByDocumentId,
  saveChatExchange,
  appendChatMessage,
  deleteChatByDocumentId,
} from "../controllers/chat_controller.js";

const router = express.Router();

router.get("/chat/:documentId", authMiddleware, getChatByDocumentId);
router.post("/chat/:documentId/exchange", authMiddleware, saveChatExchange);
router.post("/chat/:documentId/message", authMiddleware, appendChatMessage);
router.delete("/chat/:documentId", authMiddleware, deleteChatByDocumentId);

export default router;