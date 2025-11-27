const mongoose = require("mongoose");

const guideSchema = new mongoose.Schema(
  {
    guideID: { type: Number, required: true, unique: true },
    docID: { type: Number, required: true },
    guideContent: { type: String, required: true },
  },
  { collection: "guides" }
);

module.exports = mongoose.model("Guide", guideSchema);
