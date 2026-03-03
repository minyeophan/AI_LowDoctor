import mongoose from "mongoose";

const { Schema } = mongoose;

const userSchema = new Schema(
  {
    userID: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, default: "user" }, // "user" 또는 "admin"
  },
  { collection: "users" }
);

export default mongoose.model('User', userSchema);