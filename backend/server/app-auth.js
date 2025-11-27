// app-auth.js
require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const cors = require("cors");

const User = require("./models/User");

const app = express();
const PORT = 5000;

// JWT 비밀키 (.env에 JWT_SECRET 넣어도 되고, 없으면 기본값 사용)
const JWT_SECRET = process.env.JWT_SECRET || "DEV_SECRET_KEY_CHANGE_ME";

// MongoDB 연결
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("✅ MongoDB 연결 성공 (auth)"))
  .catch((err) => console.error(err));

app.use(cors());
app.use(express.json());

// ----------------------
// 회원가입 API
// ----------------------
app.post("/signup", async (req, res) => {
  try {
    const { userID, password, name, email } = req.body;

    if (!userID || !password || !name || !email) {
      return res.status(400).json({ message: "필수값 누락" });
    }

    // 중복 아이디 체크
    const exists = await User.findOne({ userID });
    if (exists) {
      return res.status(400).json({ message: "이미 존재하는 ID입니다." });
    }

    // 중복 이메일 체크 (선택)
    const emailExists = await User.findOne({ email });
    if (emailExists) {
      return res.status(400).json({ message: "이미 사용 중인 이메일입니다." });
    }

    // 비밀번호 해시
    const hashedPw = await bcrypt.hash(password, 10);

    await User.create({
      userID,
      name,
      email,
      password: hashedPw,
    });

    return res.json({ message: "회원가입 성공" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "서버 오류" });
  }
});

// ----------------------
// 로그인 API (JWT 발급)
// ----------------------
app.post("/login", async (req, res) => {
  try {
    const { userID, password } = req.body;

    const user = await User.findOne({ userID });
    if (!user) {
      return res.status(400).json({ message: "존재하지 않는 ID" });
    }

    // 비밀번호 검증
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "비밀번호 불일치" });
    }

    // JWT 발급
    const token = jwt.sign(
      {
        userID: user.userID,
        name: user.name,
      },
      JWT_SECRET,
      { expiresIn: "2h" }
    );

    res.json({
      message: "로그인 성공",
      token,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "서버 오류" });
  }
});

// ----------------------
// JWT 검증 미들웨어
// ----------------------
function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader)
    return res.status(401).json({ message: "토큰 없음" });

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // { userID, name, iat, exp }
    next();
  } catch (err) {
    return res.status(401).json({ message: "유효하지 않은 토큰" });
  }
}

// ----------------------
// 로그인 된 사용자 정보 확인 API
// ----------------------
app.get("/me", verifyToken, (req, res) => {
  res.json({
    message: "인증 성공",
    user: req.user,
  });
});

app.listen(PORT, () => {
  console.log(`🚀 인증 서버 실행중: http://localhost:${PORT}`);
});
