const mongoose = require("mongoose");

const recommendedFormSchema = new mongoose.Schema(
  {
    docID: { type: Number, required: true },
    formID: { type: Number, required: true },
  },
  { collection: "recommendedForms" }
);

module.exports = mongoose.model("RecommendedForm", recommendedFormSchema);
