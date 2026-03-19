import bcrypt from "bcryptjs";
import User from "../schemas/user_db.js";
import { randomUUID } from "crypto";
import { serializeUser, signAccessToken } from "../service/auth_service.js";

export const signup = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        message: "name, email, password는 필수입니다.",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        message: "비밀번호는 6자 이상이어야 합니다.",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(409).json({
        message: "이미 가입된 이메일입니다.",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      userID: `user_${randomUUID()}`,
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      provider: "local",
      avatar: "",
    });

    const token = signAccessToken(user);

    return res.status(201).json({
      user: serializeUser(user),
      token,
    });
  } catch (error) {
    console.error("signup error:", error);
    return res.status(500).json({
      message: "회원가입 중 오류가 발생했습니다.",
      error: error.message,
      code: error.code || null,
    });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "email, password는 필수입니다.",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const user = await User.findOne(
      {
        email: normalizedEmail,
        provider: "local",
      },
      {
        name: 1,
        email: 1,
        avatar: 1,
        provider: 1,
        isActive: 1,
        password: 1,
      }
    );

    if (!user) {
      return res.status(401).json({
        message: "이메일 또는 비밀번호가 올바르지 않습니다.",
      });
    }

    const isMatched = await bcrypt.compare(password, user.password);
    if (!isMatched) {
      return res.status(401).json({
        message: "이메일 또는 비밀번호가 올바르지 않습니다.",
      });
    }

    await User.findByIdAndUpdate(user._id, {
      lastLoginAt: new Date(),
    });

    const token = signAccessToken(user);

    return res.status(200).json({
      user: serializeUser(user),
      token,
    });
  } catch (error) {
    console.error("login error:", error);
    return res.status(500).json({
      message: "로그인 중 오류가 발생했습니다.",
      error: error.message,
      code: error.code || null,
    });
  }
};

export const logout = async (req, res) => {
  return res.status(200).json({
    message: "로그아웃 성공",
  });
};

export const getMe = async (req, res) => {
  try {
    return res.status(200).json(serializeUser(req.user));
  } catch (error) {
    console.error("getMe error:", error);
    return res.status(500).json({
      message: "사용자 정보를 불러오는 중 오류가 발생했습니다.",
    });
  }
};

export default {
  signup,
  login,
  logout,
  getMe,
};