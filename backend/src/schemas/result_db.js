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
  checkPoints: [{ type: String }],
  improvedClause: {
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

const improvementGuideSchema = new Schema({
  id: { type: Number },
  originalClause: { type: String },
  checkPoints: [{ type: String }],
  improvedClause: { type: String }
}, { _id: false });

const contractTipSchema = new Schema({
  docType: { type: String },
  title: { type: String },
  items: [{ type: String }]
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
    forms: [formSchema],
    improvementGuides: [improvementGuideSchema],
    contractTip: contractTipSchema
  },
  {
    timestamps: true
  }
);

export default mongoose.model("Result", resultSchema);
