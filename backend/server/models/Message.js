const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    messageID: { type: Number, required: true, unique: true },
    userID: { type: String, required: true },
    question: { type: String, required: true },
    answer: { type: String },
    token: { type: Number },
    createDate: { type: Date, default: Date.now },
  },
  { collection: "messages" }
);

module.exports = mongoose.model("Message", messageSchema);
