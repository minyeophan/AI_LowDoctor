const mongoose = require("mongoose");

const caseSchema = new mongoose.Schema(
  {
    docID: { type: Number, required: true },
    postID: { type: Number, required: true },
  },
  { collection: "cases" }
);

module.exports = mongoose.model("Case", caseSchema);
