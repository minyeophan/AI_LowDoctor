import mongoose from "mongoose";

const { Schema, model } = mongoose;

const chatMessageSchema = new Schema(
  {
    role: {
      type: String,
      required: true,
      enum: ["user", "assistant", "system"],
    },
    content: {
      type: String,
      required: true,
      trim: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    _id: true,
    versionKey: false,
  }
);

const chatSchema = new Schema(
  {
    // 실제 사용자 연결용
    userRef: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // 기존 프로젝트 userID 호환용
    userID: {
      type: String,
      required: true,
      index: true,
    },

    // 업로드된 계약서 식별자
    documentId: {
      type: String,
      required: true,
      index: true,
    },

    // 선택: 분석 결과와 연결하고 싶을 때 사용
    resultId: {
      type: Schema.Types.ObjectId,
      ref: "Result",
      default: null,
    },

    // 채팅방 제목(없어도 되지만 있으면 관리 편함)
    title: {
      type: String,
      default: "계약서 상담",
      trim: true,
    },

    // 메시지 목록
    messages: {
      type: [chatMessageSchema],
      default: [],
    },

    // 마지막 메시지 시간 (정렬/조회 편의용)
    lastMessageAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// 한 사용자당 한 문서에 대해 하나의 채팅 세션만 갖게 할 때 유용
chatSchema.index({ userRef: 1, documentId: 1 }, { unique: true });

// 메시지 추가 helper
chatSchema.methods.addMessage = function ({ role, content }) {
  this.messages.push({
    role,
    content,
    createdAt: new Date(),
  });
  this.lastMessageAt = new Date();
  return this.save();
};

const Chat = model("Chat", chatSchema);

export default Chat;