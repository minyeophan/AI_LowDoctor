import mongoose from "mongoose";

const { Schema } = mongoose;

const analysisSchema = new Schema(
  {
    documentId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    status: {
      type: String,
      enum: ["processing", "completed", "failed"],
      default: "processing"
    },
    extractedText: {
      type: String
    },
    result: {
      type: Schema.Types.Mixed
    },
    errorMessage: {
      type: String
    }
  },
  {
    timestamps: true
  }
);

export default mongoose.model('Analysis', analysisSchema);