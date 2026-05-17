import Chat from "../schemas/chat_db.js";
import { askChatbot } from "../service/ai_service.js";

const safeString = (value = "") => String(value || "").trim();

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
 * "더 쉽게 알려줘", "쉽게알려줘", "자세히 설명해줘" 같은 후속 질문인지 판단
 */
const isFollowUpQuestion = (question = "") => {
  const q = safeString(question);
  const normalized = q.replace(/\s+/g, "");

  const followUpKeywords = [
    "더 쉽게",
    "쉽게 알려줘",
    "좀 더 쉽게",
    "자세히",
    "더 자세히",
    "설명해줘",
    "다시 설명",
    "그게 무슨 뜻",
    "그게 뭐야",
    "무슨 말",
    "예시",
    "예를 들어",
  ];

  const normalizedKeywords = [
    "더쉽게",
    "쉽게알려줘",
    "좀더쉽게",
    "자세히",
    "더자세히",
    "설명해줘",
    "다시설명",
    "그게무슨뜻",
    "그게뭐야",
    "무슨말",
    "예시",
    "예를들어",
  ];

  return (
    followUpKeywords.some((keyword) => q.includes(keyword)) ||
    normalizedKeywords.some((keyword) => normalized.includes(keyword))
  );
};

/**
 * 후속 질문일 때만 바로 직전 챗봇 답변 1개를 AI 서버에 함께 전달
 * 단, 업로드 문서 원문(documentText)은 전달하지 않음
 */
const buildChatContextQuestion = (question, messages = []) => {
  // 후속 질문이 아니면 이전 대화를 붙이지 않는다.
  // 예: "임대인", "커뮤니티", "계약서 분석해줘"는 그대로 전달
  if (!isFollowUpQuestion(question)) {
    return question;
  }

  const recentMessages = messages || [];

  // 가장 최근 챗봇 답변 1개만 찾는다.
  // 이전 사용자 질문이나 오래된 대화는 포함하지 않아서
  // "커뮤니티" 같은 예전 키워드가 섞이는 문제를 막는다.
  const lastAssistantMessage = [...recentMessages]
    .reverse()
    .find((message) => message.role === "assistant" && message.content);

  if (!lastAssistantMessage) {
    return question;
  }

  return [
    "[이전 챗봇 답변]",
    lastAssistantMessage.content,
    "",
    "[현재 질문]",
    question,
    "",
    "위 이전 챗봇 답변을 기준으로 현재 질문에 답하세요.",
    "사용자가 '쉽게 알려줘', '더 쉽게', '자세히'처럼 말하면 이전 답변을 다시 쉽게 설명하세요.",
    "새로운 주제로 바꾸지 마세요.",
  ].join("\n");
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
 *   "answer": "위약금 조항이 불명확합니다.", // 선택
 *   "currentPath": "/aidt/...",
 *   "title": "주거용 월세 계약서 상담",   // 선택
 *   "resultId": "..."                     // 선택
 * }
 */
export const saveChatExchange = async (req, res, next) => {
  try {
    const documentId = safeString(req.params.documentId);
    const question = safeString(req.body.question);
    let answer = safeString(req.body.answer || "");
    const currentPath = safeString(req.body.currentPath || "");
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

    if (!question) {
      return res.status(400).json({
        message: "question은 필수입니다.",
      });
    }

    /**
     * 프론트에서 answer 없이 question만 보낸 경우,
     * 백엔드가 Python AI 서버에 질문을 전달해 답변을 생성한다.
     *
     * documentText는 보내지 않으므로
     * 업로드 문서 원문 직접 답변 기능은 연결하지 않는다.
     *
     * "더 쉽게 알려줘" 같은 후속 질문일 때만
     * 바로 직전 챗봇 답변 1개를 question에 포함한다.
     */
    if (!answer) {
      const existingChat = await Chat.findOne({
        userRef: req.user._id,
        documentId,
      }).sort({ updatedAt: -1 });

      const questionForAI = buildChatContextQuestion(
        question,
        existingChat?.messages || []
      );

      answer = await askChatbot({
        question: questionForAI,
        currentPath,
      });
    }

    if (!answer) {
      return res.status(502).json({
        message: "챗봇 답변 생성에 실패했습니다.",
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

    return res.status(200).json({
      ...serializeChat(chat),
      answer,
    });
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