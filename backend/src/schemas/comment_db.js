import mongoose from "mongoose";

const { Schema, model } = mongoose;

const commentSchema = new Schema(
  {
    postId: {
      type: Schema.Types.ObjectId,
      ref: "Post",
      required: true,
      index: true,
    },

    userRef: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    userID: {
      type: String,
      required: true,
      index: true,
    },

    content: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500,
    },

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

commentSchema.index({ postId: 1, createdAt: 1 });

const Comment = model("Comment", commentSchema);
export default Comment;