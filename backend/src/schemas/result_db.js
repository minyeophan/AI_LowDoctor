import mongoose from "mongoose";

const { Schema } = mongoose;

const lawRefSchema = new Schema({
  name: {
    type: String,
    required: true
  },
  article: {
    type: String,
    required: true
  },
  url: {
    type: String
  }
}, { _id: false });

const riskItemSchema = new Schema({
  id: {
    type: Number,
    required: true
  },
  clauseText: { 
    type: String,
    required: true 
  },
  riskLevel: {
    type: String,
    enum: ["low", "medium", "high"],
    required: true
  },
  reason: {
    type: String,
    required: true
  },
  lawRefs: [lawRefSchema],
  guide: {
    type: String
  }
}, { _id: false });

const formSchema = new Schema({
  type: {
    type: String,
    required: true
  },
  description: {
    type: String
  },
  downloadUrl: {
    type: String
  }
}, { _id: false });

const resultSchema = new Schema(
  {
    documentId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    summary: {
      type: String,
      required: true
    },
    riskItems: [riskItemSchema],
    forms: [formSchema]
  },
  {
    timestamps: true
  }
);

export default mongoose.model("Result", resultSchema);