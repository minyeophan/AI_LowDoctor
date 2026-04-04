import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";

const { Schema } = mongoose;

const userSchema = new Schema(
  {
    userID: { 
      type: String, 
      required: true, 
      unique: true, 
      default: () => `user_${randomUUID()}`, 
    },

    name: {
      type: String, 
      required: true, 
      trim: true, 
    },

    email: { 
      type: String, 
      required: true, 
      unique: true, 
      lowercase: true,
      trim: true, 
    },

    password: { 
      type: String, 
      required: true, 
      select: false,
    },
      
    avatar: {
      type: String,
      default: "",
    },

    provider: {
      type: String,
      enum: ["local", "kakao", "naver"],
      default: "local",
    },

    providerId: {
      type: String,
      default: null,
    },

    role: { 
      type: String, 
      default: "user" 
    }, // "user" 또는 "admin"

    isActive: {
      type: Boolean,
      default: true,
    },

    lastLoginAt: {
      type: Date,
      default: null,
    },
  },
  { collection: "users" }
);


export default mongoose.model('User', userSchema);