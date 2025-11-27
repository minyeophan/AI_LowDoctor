// models/Schedule.js
const mongoose = require("mongoose");

const scheduleSchema = new mongoose.Schema(
  {
    scheduleID: { type: Number, required: true, unique: true }, // 스케줄 번호
    userID: { type: String, required: true },                   // 사용자
    docID: { type: Number, required: true },                    // 어떤 문서 분석과 연결되는지
    alertAt: { type: Date, required: true },                    // 알림 시간
    message: { type: String, required: true },                  // 알림 내용
    done: { type: Boolean, default: false },                    // 알림 처리 여부(미사용 가능)
  },
  {
    collection: "schedules",
    timestamps: { createdAt: "createdAt", updatedAt: "updatedAt" },
  }
);

module.exports = mongoose.model("Schedule", scheduleSchema);
