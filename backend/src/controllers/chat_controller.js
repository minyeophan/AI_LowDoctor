import Chat from "../schemas/chat_db.js";

const safeString = (value = "") => String(value).trim();

const serializeChat = (chatDoc) => {
  if (!chatDoc) {
    return {
      id: null,
      documentId: "",
      title: "계약서 상담",
      resultId: null,
      lastMessageAt: null,
      messages: [],
    };
  }

  return {
    id: chatDoc._id.toString(),
    documentId: chatDoc.documentId,
    title: chatDoc.title || "계약서 상담",
    resultId: chatDoc.resultId ? chatDoc.resultId.toString() : null,
    lastMessageAt: chatDoc.lastMessageAt || null,
    messages: (chatDoc.messages || []).map((message) => ({
      id: message._id?.toString?.() || null,
      role: message.role,
      content: message.content,
      createdAt: message.createdAt,
    })),
  };
};

/**
 * 특정 문서의 채팅 조회
 * GET /api/chat/:documentId
 */
export const getChatByDocumentId = async (req, res, next) => {
  try {
    const documentId = safeString(req.params.documentId);

    if (!req.user) {
      return res.status(401).json({
        message: "로그인이 필요합니다.",
      });
    }

    if (!documentId) {
      return res.status(400).json({
        message: "documentId는 필수입니다.",
      });
    }

    const chat = await Chat.findOne({
      userRef: req.user._id,
      documentId,
    }).sort({ updatedAt: -1 });

    if (!chat) {
      return res.status(200).json({
        id: null,
        documentId,
        title: "계약서 상담",
        resultId: null,
        lastMessageAt: null,
        messages: [],
      });
    }

    return res.status(200).json(serializeChat(chat));
  } catch (error) {
    console.error("getChatByDocumentId error:", error);
    next(error);
  }
};

/**
 * 질문-답변 한 쌍 저장
 * POST /api/chat/:documentId/exchange
 *
 * body:
 * {
 *   "question": "여기 위험조항이 뭐야?",
 *   "answer": "위약금 조항이 불명확합니다.",
 *   "title": "주거용 월세 계약서 상담",   // 선택
 *   "resultId": "..."                     // 선택
 * }
 */
export const saveChatExchange = async (req, res, next) => {
  try {
    const documentId = safeString(req.params.documentId);
    const question = safeString(req.body.question);
    const answer = safeString(req.body.answer);
    const title = safeString(req.body.title || "");
    const resultId = safeString(req.body.resultId || "");

    if (!req.user) {
      return res.status(401).json({
        message: "로그인이 필요합니다.",
      });
    }

    if (!documentId) {
      return res.status(400).json({
        message: "documentId는 필수입니다.",
      });
    }

    if (!question || !answer) {
      return res.status(400).json({
        message: "question과 answer는 필수입니다.",
      });
    }

    const now = new Date();

    const update = {
      $setOnInsert: {
        userRef: req.user._id,
        userID: req.user.userID,
        documentId,
      },
      $set: {
        lastMessageAt: now,
      },
      $push: {
        messages: {
          $each: [
            {
              role: "user",
              content: question,
              createdAt: now,
            },
            {
              role: "assistant",
              content: answer,
              createdAt: new Date(),
            },
          ],
        },
      },
    };

    // title은 한 곳에서만 넣는다
    if (title) {
      update.$set.title = title;
    } else {
      update.$setOnInsert.title = "계약서 상담";
    }

    if (resultId) {
      update.$set.resultId = resultId;
    }

    const chat = await Chat.findOneAndUpdate(
      {
        userRef: req.user._id,
        documentId,
      },
      update,
      {
        new: true,
        upsert: true,
        setDefaultsOnInsert: true,
      }
    );

    return res.status(200).json(serializeChat(chat));
  } catch (error) {
    console.error("saveChatExchange error:", error);
    next(error);
  }
};


/**
 * 메시지 1개만 저장하고 싶을 때 쓰는 확장용 API
 * POST /api/chat/:documentId/message
 *
 * body:
 * {
 *   "role": "user" | "assistant" | "system",
 *   "content": "..."
 * }
 */
export const appendChatMessage = async (req, res, next) => {
  try {
    const documentId = safeString(req.params.documentId);
    const role = safeString(req.body.role);
    const content = safeString(req.body.content);
    const title = safeString(req.body.title || "");
    const resultId = safeString(req.body.resultId || "");

    if (!req.user) {
      return res.status(401).json({
        message: "로그인이 필요합니다.",
      });
    }

    if (!documentId) {
      return res.status(400).json({
        message: "documentId는 필수입니다.",
      });
    }

    if (!["user", "assistant", "system"].includes(role)) {
      return res.status(400).json({
        message: "role은 user, assistant, system 중 하나여야 합니다.",
      });
    }

    if (!content) {
      return res.status(400).json({
        message: "content는 필수입니다.",
      });
    }

    const now = new Date();

    const update = {
      $setOnInsert: {
        userRef: req.user._id,
        userID: req.user.userID,
        documentId,
      },
      $set: {
        lastMessageAt: now,
      },
      $push: {
        messages: {
          role,
          content,
          createdAt: now,
        },
      },
    };

    // title은 한 곳에서만 넣는다
    if (title) {
      update.$set.title = title;
    } else {
      update.$setOnInsert.title = "계약서 상담";
    }

    if (resultId) {
      update.$set.resultId = resultId;
    }

    const chat = await Chat.findOneAndUpdate(
      {
        userRef: req.user._id,
        documentId,
      },
      update,
      {
        new: true,
        upsert: true,
        setDefaultsOnInsert: true,
      }
    );

    return res.status(200).json(serializeChat(chat));
  } catch (error) {
    console.error("appendChatMessage error:", error);
    next(error);
  }
};

/**
 * 특정 문서 채팅 전체 삭제
 * DELETE /api/chat/:documentId
 */
export const deleteChatByDocumentId = async (req, res, next) => {
  try {
    const documentId = safeString(req.params.documentId);

    if (!req.user) {
      return res.status(401).json({
        message: "로그인이 필요합니다.",
      });
    }

    if (!documentId) {
      return res.status(400).json({
        message: "documentId는 필수입니다.",
      });
    }

    await Chat.findOneAndDelete({
      userRef: req.user._id,
      documentId,
    });

    return res.status(200).json({
      message: "채팅 기록이 삭제되었습니다.",
    });
  } catch (error) {
    console.error("deleteChatByDocumentId error:", error);
    next(error);
  }
};