import mongoose from "mongoose";

const { Schema, model } = mongoose;

const formSchema = new Schema(
  {
    form_name: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      required: true,
      trim: true,
      default: "전체",
    },
    source: {
      type: String,
      default: "",
      trim: true,
    },
    fileUrl: {
      type: String,
      required: true,
      trim: true,
    },
    downloadCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

const Form = model("Form", formSchema);

export default Form;