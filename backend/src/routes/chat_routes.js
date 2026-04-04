import express from "express";
import authMiddleware from "../middleware/auth_middle.js";
import {
  getChatByDocumentId,
  saveChatExchange,
  appendChatMessage,
  deleteChatByDocumentId,
} from "../controllers/chat_controller.js";

const router = express.Router();

/**
 * app.js에서:
 * app.use("/api", chatRouter);
 *
 * 실제 경로:
 * GET    /api/chat/:documentId
 * POST   /api/chat/:documentId/exchange
 * POST   /api/chat/:documentId/message
 * DELETE /api/chat/:documentId
 */

router.get("/chat/:documentId", authMiddleware, getChatByDocumentId);
router.post("/chat/:documentId/exchange", authMiddleware, saveChatExchange);
router.post("/chat/:documentId/message", authMiddleware, appendChatMessage);
router.delete("/chat/:documentId", authMiddleware, deleteChatByDocumentId);

export default router;