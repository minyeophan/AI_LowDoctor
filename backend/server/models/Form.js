const mongoose = require("mongoose");

const formSchema = new mongoose.Schema(
  {
    formID: { type: Number, required: true, unique: true },
    formName: { type: String, required: true },
    category: { type: String },
    source: { type: String },
    saveDate: { type: Date, default: Date.now },
  },
  { collection: "forms" }
);

module.exports = mongoose.model("Form", formSchema);
