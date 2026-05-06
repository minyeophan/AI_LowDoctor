import mongoose from "mongoose";

const { Schema, model } = mongoose;

const sharedRiskItemSchema = new Schema(
  {
    title: {
      type: String,
      default: "",
      trim: true,
    },
    clause: {
      type: String,
      default: "",
      trim: true,
    },
    reason: {
      type: String,
      default: "",
      trim: true,
    },
    level: {
      type: String,
      default: "",
      trim: true,
    },
  },
  {
    _id: false,
  }
);

const sharedGuideItemSchema = new Schema(
  {
    title: {
      type: String,
      default: "",
      trim: true,
    },
    content: {
      type: String,
      default: "",
      trim: true,
    },
  },
  {
    _id: false,
  }
);

const sharedMetaSchema = new Schema(
  {
    documentId: {
      type: String,
      default: "",
      index: true,
    },
    resultId: {
      type: Schema.Types.ObjectId,
      ref: "Result",
      default: null,
      index: true,
    },
    contractType: {
      type: String,
      default: "부동산",
      trim: true,
    },
    sourceType: {
      type: String,
      enum: ["analysis", "manual", ""],
      default: "analysis",
    },
  },
  {
    _id: false,
  }
);

const sharedContentSchema = new Schema(
  {
    summary: {
      type: String,
      default: "",
      trim: true,
    },
    riskItems: {
      type: [sharedRiskItemSchema],
      default: [],
    },
    guide: {
      type: [sharedGuideItemSchema],
      default: [],
    },
  },
  {
    _id: false,
  }
);

const postSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },

    content: {
      type: String,
      required: true,
      trim: true,
    },

    category: {
      type: String,
      required: true,
      enum: ["부동산"],
      default: "부동산",
    },

    // 작성자 연결
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

    likes: {
      type: [String],
      default: [],
    },

    // ===== 공유글 확장 필드 =====
    isShared: {
      type: Boolean,
      default: false,
      index: true,
    },

    sharedMeta: {
      type: sharedMetaSchema,
      default: () => ({}),
    },

    sharedContent: {
      type: sharedContentSchema,
      default: () => ({
        summary: "",
        riskItems: [],
        guide: [],
      }),
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
postSchema.index({ isShared: 1, createdAt: -1 });
postSchema.index({ "sharedMeta.documentId": 1 });

const Post = model("Post", postSchema);

export default Post;