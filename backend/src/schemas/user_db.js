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
      required: function() {
        return this.provider === "local";
      }, 
      select: false,
    },
      
    avatar: {
      type: String,
      default: "",
    },

    provider: {
      type: String,
      enum: ["local", "kakao", "naver", "google"],
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

    // 사용자가 다운로드한 양식 목록을 배열로 관리
    savedForms: [{
      formId: { type: Schema.Types.ObjectId, ref: 'Form' },
      save_date: { type: Date, default: Date.now }
    }],

    googleAccessToken: {
      type: String,
      default: null,
    },
    googleRefreshToken: {
      type: String,
      default: null,
    },
    googleTokenExpiry: {
      type: Date,
      default: null,
    },
  },
  { collection: "users" }
);


export default mongoose.model('User', userSchema);