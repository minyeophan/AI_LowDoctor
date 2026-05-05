import mongoose from "mongoose";

const { Schema, model } = mongoose;

const postSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 60,
    },
    content: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      required: true,
      trim: true,
      default: "부동산",
    },

    // 관계 연결용
    userRef: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // 기존 프로젝트 호환용
    userID: {
      type: String,
      required: true,
      index: true,
    },

    views: {
      type: Number,
      default: 0,
      min: 0,
    },

    // 좋아요 누른 사용자 userID 저장
    likes: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

postSchema.index({ category: 1, createdAt: -1 });
postSchema.index({ views: -1 });
postSchema.index({ title: "text", content: "text" });

const Post = model("Post", postSchema);
export default Post;