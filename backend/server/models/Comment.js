// models/Comment.js
const mongoose = require("mongoose");

const commentSchema = new mongoose.Schema(
  {
    commentID: { type: Number, required: true, unique: true }, // 댓글 번호
    postID: { type: Number, required: true },                  // 어느 게시글의 댓글인지
    userID: { type: String, required: true },                  // 작성자 ID
    authorName: { type: String, required: true },              // 작성자 이름
    content: { type: String, required: true },                 // 댓글 내용

    // 대댓글 기능: null이면 일반 댓글, 숫자면 부모 댓글 ID
    parentCommentID: { type: Number, default: null },

    // 👍 좋아요 기능
    likesCount: { type: Number, default: 0 },
    likedUsers: { type: [String], default: [] }, // 좋아요 누른 userID 목록
  },
  {
    collection: "comments",
    timestamps: { createdAt: "createdAt", updatedAt: "updatedAt" },
  }
);

module.exports = mongoose.model("Comment", commentSchema);
