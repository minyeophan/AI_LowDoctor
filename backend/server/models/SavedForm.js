const mongoose = require("mongoose");

const savedFormSchema = new mongoose.Schema(
  {
    userID: { type: String, required: true },
    formID: { type: Number, required: true },
    saveDate: { type: Date, default: Date.now },
  },
  { collection: "savedForms" }
);

module.exports = mongoose.model("SavedForm", savedFormSchema);
