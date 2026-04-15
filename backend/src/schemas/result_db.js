import mongoose from "mongoose";

const { Schema } = mongoose;

const lawRefSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  article: {
    type: String,
    required: true,
  },
  url: {
    type: String,
  },
}, { _id: false });

const riskItemSchema = new Schema({
  id: {
    type: Number,
    required: true,
  },
  clauseText: {
    type: String,
    required: true,
  },
  riskLevel: {
    type: String,
    enum: ["low", "medium", "high"],
    required: true,
  },
  reason: {
    type: String,
    required: true,
  },
  lawRefs: [lawRefSchema],
  checkPoints: [{ type: String }],
  improvedClause: {
    type: String,
  },
}, { _id: false });

const formSchema = new Schema({
  type: {
    type: String,
    required: true,
  },
  description: {
    type: String,
  },
  downloadUrl: {
    type: String,
  },
}, { _id: false });

const improvementGuideSchema = new Schema({
  id: { type: Number },
  originalClause: { type: String },
  checkPoints: [{ type: String }],
  improvedClause: { type: String },
  riskLevel: { type: String, enum: ['low', 'medium', 'high'], default: 'low' },
}, { _id: false });

const contractTipSchema = new Schema({
  docType: { type: String },
  title: { type: String },
  items: [{ type: String }],
}, { _id: false });

const resultSchema = new Schema(
  {
    documentId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    // Hybrid 구조 핵심: 프론트/조회용 고정 필드
    summary: {
      type: String,
      required: true,
      default: "",
    },
    riskItems: [riskItemSchema],
    forms: [formSchema],
    improvementGuides: [improvementGuideSchema],
    contractTip: contractTipSchema,

    // Hybrid 구조 핵심: 원본 AI 결과 전체 저장
    analysis: {
      type: Schema.Types.Mixed,
      default: null,
    },

    // 어떤 엔진/모델로 생성됐는지 기록
    engine: {
      type: String,
      enum: ["openai", "gemini", "unknown"],
      default: "unknown",
    },
    model: {
      type: String,
      default: "",
    },

    // 결과 저장 상태
    status: {
      type: String,
      enum: ["done", "failed"],
      default: "done",
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("Result", resultSchema);