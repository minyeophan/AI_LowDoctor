import Chat from "../schemas/chat_db.js";
import Analysis from "../schemas/analyze_db.js";
import Result from "../schemas/result_db.js";
import Upload from "../schemas/upload_db.js";
import { askChatbot } from "../service/ai_service.js";

const GENERAL_CHAT_ID = "__general__";
const MAX_DOCUMENT_CONTEXT_CHARS = 700;

const safeString = (value = "") => String(value ?? "").trim();

const getDefaultTitle = (documentId) =>
  documentId === GENERAL_CHAT_ID ? "일반 법률 상담" : "계약서 상담";

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
    title: chatDoc.title || getDefaultTitle(chatDoc.documentId),
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

const normalizeText = (value = "") =>
  String(value || "")
    .replace(/\s+/g, " ")
    .trim();

const isFollowUpQuestion = (question = "") => {
  const q = safeString(question);
  if (!q) return false;

  return [
    "더 쉽게",
    "쉽게 설명",
    "쉽게 알려",
    "추가 설명",
    "추가로 설명",
    "자세히",
    "자세하게",
    "예시",
    "예를 들어",
    "알려줘",
    "설명해줘",
    "다시 설명",
    "이해가 안",
    "이해 안",
    "무슨 말",
    "무슨 뜻",
    "풀어서",
    "쉽게 풀어",
    "더 자세히",
  ].some((keyword) => q.includes(keyword));
};

const isDocumentQuestion = (question = "") => {
  const q = safeString(question);

  return [
    "특약",
    "조항",
    "계약서",
    "이 문서",
    "이 내용",
    "위험",
    "불리",
    "주의",
    "확인",
    "봐줘",
    "검토",
    "분석",
    "원상복구",
    "보증금",
    "해지",
    "관리비",
    "위약금",
    "대응가이드",
    "개선안",
  ].some((keyword) => q.includes(keyword));
};

const buildQuestionWithContext = (question, messages = []) => {
  if (!isFollowUpQuestion(question)) {
    return question;
  }

  const recentMessages = (messages || [])
    .filter((msg) => msg.role === "user" || msg.role === "assistant")
    .slice(-4);

  if (recentMessages.length === 0) {
    return question;
  }

  const contextText = recentMessages
    .map((msg) => {
      const roleLabel = msg.role === "user" ? "사용자" : "AI";
      return `${roleLabel}: ${safeString(msg.content)}`;
    })
    .join("\n");

  return `
이전 대화 내용:
${contextText}

현재 사용자 질문:
${question}

위 이전 대화의 맥락을 기준으로 현재 질문에 답변해줘.
`.trim();
};

const getQuestionKeywords = (question = "") => {
  const raw = normalizeText(question);

  const words = raw
    .split(/[\s,./?~!@#$%^&*()_+\-=|\[\]{}:;"'<>]+/)
    .map((word) => word.trim())
    .filter((word) => word.length >= 2);

  const expanded = new Set(words);

  const synonymMap = {
    특약: ["특약", "특약사항", "약정", "조항", "책임", "부담", "공제", "위약금", "손해배상", "해지", "원상복구", "관리비"],
    위험: ["위험", "불리", "문제", "주의", "책임", "부담", "공제", "위약금", "손해배상", "제한", "금지"],
    불리: ["불리", "위험", "문제", "책임", "부담", "공제", "위약금", "손해배상", "제한", "금지"],
    원상복구: ["원상복구", "복구", "수리", "보수", "훼손", "손상", "파손", "오염", "청소", "도배", "장판", "벽지", "바닥", "마루", "타일", "스크래치", "흠집"],
    보증금: ["보증금", "반환", "공제", "미반환", "차감", "정산", "수리비", "청소비", "연체", "관리비"],
    해지: ["해지", "계약해지", "종료", "통지", "중도해지", "위약금", "손해배상", "자동갱신", "갱신"],
    관리비: ["관리비", "공과금", "수도", "전기", "가스", "청소비", "공용관리비", "미납", "정산"],
    위약금: ["위약금", "손해배상", "배상", "책임", "부담", "중도해지"],
    개선안: ["개선안", "수정안", "대응가이드", "대응", "가이드", "주의"],
  };

  for (const word of words) {
    for (const [key, synonyms] of Object.entries(synonymMap)) {
      if (word.includes(key) || key.includes(word)) {
        synonyms.forEach((item) => expanded.add(item));
      }
    }
  }

  if (isDocumentQuestion(raw)) {
    [
      "특약",
      "원상복구",
      "보증금",
      "공제",
      "위약금",
      "손해배상",
      "해지",
      "자동갱신",
      "관리비",
      "수리비",
      "청소비",
      "하자",
      "금지",
      "책임",
      "부담",
      "위험",
      "불리",
      "주의",
      "개선안",
      "대응",
      "가이드",
    ].forEach((keyword) => expanded.add(keyword));
  }

  return Array.from(expanded);
};

const splitDocumentLines = (text = "") => {
  return String(text || "")
    .split(/\n|\.|ㆍ|•|- /)
    .map((line) => normalizeText(line))
    .filter((line) => line.length >= 8);
};

const scoreLineByKeywords = (line, keywords) => {
  let score = 0;

  for (const keyword of keywords) {
    if (keyword && line.includes(keyword)) {
      score += keyword.length >= 3 ? 2 : 1;
    }
  }

  return score;
};

const stringifySummary = (summary) => {
  if (!summary) return "";

  if (typeof summary === "string") {
    try {
      const parsed = JSON.parse(summary);

      if (Array.isArray(parsed)) {
        return parsed
          .map((item) => `${item.title || ""} ${item.content || ""}`)
          .join("\n");
      }

      if (parsed && typeof parsed === "object") {
        return Object.values(parsed).join("\n");
      }
    } catch {
      return summary;
    }

    return summary;
  }

  if (Array.isArray(summary)) {
    return summary
      .map((item) => `${item.title || ""} ${item.content || ""}`)
      .join("\n");
  }

  if (typeof summary === "object") {
    return Object.values(summary).join("\n");
  }

  return "";
};

const stringifyRiskItems = (riskItems) => {
  if (!Array.isArray(riskItems)) return "";

  return riskItems
    .map((item) =>
      [
        item.clauseText,
        item.reason,
        ...(item.checkPoints || []),
        item.improvedClause,
      ]
        .filter(Boolean)
        .join(" ")
    )
    .join("\n");
};

const stringifyImprovementGuides = (improvementGuides) => {
  if (!Array.isArray(improvementGuides)) return "";

  return improvementGuides
    .map((item) =>
      [
        item.originalClause,
        ...(item.checkPoints || []),
        item.improvedClause,
      ]
        .filter(Boolean)
        .join(" ")
    )
    .join("\n");
};

const findUploadByDocumentId = async (documentId, user) => {
  const upload = await Upload.findOne({ documentId });

  if (!upload) {
    return null;
  }

  const uploadUserID = safeString(upload.userID || "");
  const currentUserID = safeString(user?.userID || "");
  const uploadUserRef = upload.userRef?.toString?.() || "";
  const currentUserRef = user?._id?.toString?.() || "";

  const hasOwnerInfo = Boolean(uploadUserID || uploadUserRef);

  if (!hasOwnerInfo) {
    return upload;
  }

  if (uploadUserID === currentUserID || uploadUserRef === currentUserRef) {
    return upload;
  }

  return null;
};

const buildRelevantDocumentContext = async (
  referenceDocumentId,
  question,
  user
) => {
  const documentId = safeString(referenceDocumentId);

  if (!documentId || documentId === GENERAL_CHAT_ID) {
    return "";
  }

  const upload = await findUploadByDocumentId(documentId, user);

  if (!upload) {
    return "";
  }

  const [analysis, result] = await Promise.all([
    Analysis.findOne({ documentId }),
    Result.findOne({ documentId }),
  ]);

  if (!analysis && !result) {
    return "";
  }

  const keywords = getQuestionKeywords(question);

  const analysisResult = analysis?.result || {};
  const resultAnalysis = result?.analysis || {};

  const riskText = [
    stringifyRiskItems(result?.riskItems),
    stringifyRiskItems(analysisResult?.riskItems),
    stringifyRiskItems(resultAnalysis?.riskItems),
  ]
    .filter(Boolean)
    .join("\n");

  const improvementText = [
    stringifyImprovementGuides(result?.improvementGuides),
    stringifyImprovementGuides(analysisResult?.improvementGuides),
    stringifyImprovementGuides(resultAnalysis?.improvementGuides),
  ]
    .filter(Boolean)
    .join("\n");

  const summaryText = [
    stringifySummary(result?.summary),
    stringifySummary(analysis?.summary),
    stringifySummary(analysisResult?.summary),
    stringifySummary(resultAnalysis?.summary),
  ]
    .filter(Boolean)
    .join("\n");

  const contractTipText = [
    result?.contractTip?.title,
    ...(result?.contractTip?.items || []),
    analysisResult?.contractTip,
    resultAnalysis?.contractTip,
  ]
    .filter(Boolean)
    .join("\n");

  const extractedText =
    analysis?.extractedText ||
    analysis?.extracted_text ||
    result?.extractedText ||
    result?.extracted_text ||
    "";

  const sourceText = [
    riskText,
    improvementText,
    summaryText,
    contractTipText,
    extractedText,
  ]
    .filter(Boolean)
    .join("\n");

  if (!sourceText) {
    return "";
  }

  const lines = splitDocumentLines(sourceText);

  const rankedLines = lines
    .map((line) => ({
      line,
      score: scoreLineByKeywords(line, keywords),
    }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((item) => item.line);

  let selectedText = rankedLines.join("\n");

  if (!selectedText) {
    selectedText = [riskText, improvementText, summaryText, contractTipText]
      .filter(Boolean)
      .join("\n");
  }

  if (!selectedText && extractedText) {
    selectedText = extractedText;
  }

  return normalizeText(selectedText).slice(0, MAX_DOCUMENT_CONTEXT_CHARS);
};

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
        title: getDefaultTitle(documentId),
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

export const saveChatExchange = async (req, res, next) => {
  try {
    const documentId = safeString(req.params.documentId);
    const question = safeString(req.body.question);
    let answer = safeString(req.body.answer);
    const currentPath = safeString(req.body.currentPath || "");
    const referenceDocumentId = safeString(req.body.referenceDocumentId || "");
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

    const existingChat = await Chat.findOne({
      userRef: req.user._id,
      documentId,
    }).sort({ updatedAt: -1 });

    if (!answer) {
      try {
        const questionForAI = buildQuestionWithContext(
          question,
          existingChat?.messages || []
        );

        const documentText = await buildRelevantDocumentContext(
          referenceDocumentId,
          question,
          req.user
        );

        if (referenceDocumentId && isDocumentQuestion(question) && !documentText) {
          answer =
            "업로드 문서를 기준으로 답변하려면 먼저 문서 분석을 완료해 주세요.\n\n문서 분석이 완료되면 요약, 위험탐지, 대응가이드 결과를 바탕으로 관련 내용만 참고해서 답변할 수 있습니다.";
        } else {
          answer = await askChatbot(questionForAI, currentPath, documentText);
        }
      } catch (error) {
        console.error("askChatbot error:", error);
        return res.status(error.status || 500).json({
          message: error.message || "챗봇 응답 생성에 실패했습니다.",
        });
      }
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

    if (title) {
      update.$set.title = title;
    } else {
      update.$setOnInsert.title = getDefaultTitle(documentId);
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

    if (title) {
      update.$set.title = title;
    } else {
      update.$setOnInsert.title = getDefaultTitle(documentId);
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