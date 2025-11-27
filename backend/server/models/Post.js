// models/Post.js
const mongoose = require("mongoose");

const postSchema = new mongoose.Schema(
  {
    postID: { type: Number, required: true, unique: true }, // 게시글 번호
    userID: { type: String, required: true },               // 작성자 ID
    authorName: { type: String, required: true },           // 작성자 이름(표시용)
    title: { type: String, required: true },                // 제목
    content: { type: String, required: true },              // 내용

    // 어떤 문서/계약서와 관련된 글인지 연결 (선택)
    relatedFileId: { type: mongoose.Schema.Types.ObjectId, default: null },

    // 좋아요 기능
    likesCount: { type: Number, default: 0 },
    likedUsers: { type: [String], default: [] }, // 좋아요 누른 userID 목록
  },
  {
    collection: "posts",
    timestamps: { createdAt: "createdAt", updatedAt: "updatedAt" },
  }
);

module.exports = mongoose.model("Post", postSchema);
