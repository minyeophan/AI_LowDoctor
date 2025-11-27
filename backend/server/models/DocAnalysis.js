// models/DocAnalysis.js
const mongoose = require("mongoose");

const docAnalysisSchema = new mongoose.Schema(
  {
    docID: { type: Number, required: true, unique: true }, // 문서 분석 번호
    userID: { type: String, required: true },              // 분석 요청한 사용자
    fileId: { type: mongoose.Schema.Types.ObjectId, required: true }, // GridFS 파일 ID
    result: { type: String, required: true },              // 분석 결과 텍스트
    danger: { type: Number, required: true },              // 위험도 (0~100 점수 등)
  },
  {
    collection: "docAnalyses",
    timestamps: { createdAt: "createdAt", updatedAt: "updatedAt" },
  }
);

module.exports = mongoose.model("DocAnalysis", docAnalysisSchema);
