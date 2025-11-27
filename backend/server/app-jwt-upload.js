// app-jwt-upload.js
require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const multer = require("multer");
const cors = require("cors");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const User = require("./models/User");
const DocAnalysis = require("./models/DocAnalysis");
const Schedule = require("./models/Schedule");
const Post = require("./models/Post");
const Comment = require("./models/Comment");

const app = express();
const PORT = 4000;

const mongoURI = process.env.MONGODB_URI;
const JWT_SECRET = process.env.JWT_SECRET || "DEV_SECRET_KEY_CHANGE_ME";

const upload = multer({ storage: multer.memoryStorage() });

let gridfsBucket;

// JWT 검증 미들웨어
function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader)
    return res.status(401).json({ message: "토큰 없음" });

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // { userID, name, role, iat, exp }
    next();
  } catch (err) {
    return res.status(401).json({ message: "유효하지 않은 토큰" });
  }
}

// admin 확인 미들웨어
function verifyAdmin(req, res, next) {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({ message: "관리자 권한이 필요합니다." });
  }
  next();
}

// ID 자동 증가 유틸
async function getNextId(model, idField) {
  const doc = await model.findOne({}).sort({ [idField]: -1 }).lean();
  if (!doc) return 1;
  return doc[idField] + 1;
}

async function startServer() {
  try {
    await mongoose.connect(mongoURI);
    console.log("✅ MongoDB 연결 완료 (jwt-upload)");

    gridfsBucket = new mongoose.mongo.GridFSBucket(mongoose.connection.db, {
      bucketName: "contracts",
    });
    console.log("✅ GridFSBucket 준비 완료 (contracts)");

    app.use(cors());
    app.use(express.json());

    // ---------------------------
    // 0. 홈
    // ---------------------------
    app.get("/", (req, res) => {
      res.send("AI 법률 닥터 백엔드 (JWT + 파일 + 분석 + 커뮤니티) 동작 중!");
    });

    // ---------------------------
    // 1. 회원가입
    // ---------------------------
    app.post("/signup", async (req, res) => {
      try {
        const { userID, password, name, email } = req.body;

        if (!userID || !password || !name || !email) {
          return res.status(400).json({ message: "필수값 누락" });
        }

        const exists = await User.findOne({ userID });
        if (exists) {
          return res.status(400).json({ message: "이미 존재하는 ID입니다." });
        }

        const emailExists = await User.findOne({ email });
        if (emailExists) {
          return res
            .status(400)
            .json({ message: "이미 사용 중인 이메일입니다." });
        }

        const hashedPw = await bcrypt.hash(password, 10);

        await User.create({
          userID,
          name,
          email,
          password: hashedPw,
          role: "user", // 기본값
        });

        return res.json({ message: "회원가입 성공" });
      } catch (err) {
        console.error(err);
        res.status(500).json({ message: "서버 오류" });
      }
    });

    // ---------------------------
    // 2. 로그인 (JWT 발급 - role 포함)
    // ---------------------------
    app.post("/login", async (req, res) => {
      try {
        const { userID, password } = req.body;

        const user = await User.findOne({ userID });
        if (!user) {
          return res.status(400).json({ message: "존재하지 않는 ID" });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
          return res.status(400).json({ message: "비밀번호 불일치" });
        }

        const token = jwt.sign(
          {
            userID: user.userID,
            name: user.name,
            role: user.role, // 🔥 role 포함
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

    // ---------------------------
    // 3. 내 정보 확인 (JWT 필요)
    // ---------------------------
    app.get("/me", verifyToken, (req, res) => {
      res.json({
        message: "인증 성공",
        user: req.user,
      });
    });

    // ===========================
    // A. 파일 업로드 / 목록 / 다운로드
    // ===========================

    // A-1) 일반 파일 업로드 (JWT 필요)
    app.post("/upload", verifyToken, upload.single("file"), (req, res) => {
      try {
        if (!req.file) {
          return res.status(400).json({ message: "파일이 전달되지 않았습니다." });
        }

        const userID = req.user.userID;
        const originalName = req.file.originalname;
        const filename = originalName;

        const uploadStream = gridfsBucket.openUploadStream(filename, {
          metadata: {
            userID,
            type: "contract",
          },
          contentType: req.file.mimetype,
        });

        uploadStream.on("error", (err) => {
          console.error("업로드 중 에러:", err);
          return res.status(500).json({ message: "파일 업로드 중 오류" });
        });

        uploadStream.on("finish", () => {
          const fileId = uploadStream.id;
          console.log("✅ 파일 업로드 완료:", fileId.toString());

          return res.json({
            message: "파일 업로드 성공",
            fileId,
            filename,
            metadata: { userID, type: "contract" },
          });
        });

        uploadStream.end(req.file.buffer);
      } catch (err) {
        console.error(err);
        return res.status(500).json({ message: "서버 내부 오류" });
      }
    });

    // A-2) 내 파일 목록 (JWT 필요)
    app.get("/files", verifyToken, async (req, res) => {
      try {
        const userID = req.user.userID;

        const cursor = gridfsBucket.find({ "metadata.userID": userID });
        const files = await cursor.toArray();

        if (!files || files.length === 0) {
          return res.status(404).json({ message: "파일이 없습니다." });
        }

        res.json(
          files.map((f) => ({
            id: f._id,
            filename: f.filename,
            uploadDate: f.uploadDate,
            metadata: f.metadata,
          }))
        );
      } catch (err) {
        console.error(err);
        res.status(500).json({ message: "파일 목록 조회 중 오류" });
      }
    });

    // A-3) 파일 다운로드 (로그인 없이도 가능)
    app.get("/file/:id", async (req, res) => {
      try {
        const { ObjectId } = mongoose.Types;
        const fileId = new ObjectId(req.params.id);

        const cursor = gridfsBucket.find({ _id: fileId });
        const files = await cursor.toArray();

        if (!files || files.length === 0) {
          return res.status(404).json({ message: "파일을 찾을 수 없습니다." });
        }

        const file = files[0];

        res.set({
          "Content-Type": file.contentType || "application/octet-stream",
          "Content-Disposition": `attachment; filename="${file.filename}"`,
        });

        const downloadStream = gridfsBucket.openDownloadStream(fileId);
        downloadStream.on("error", (err) => {
          console.error(err);
          res.status(500).json({ message: "파일 다운로드 중 오류" });
        });

        downloadStream.pipe(res);
      } catch (err) {
        console.error(err);
        res.status(400).json({ message: "잘못된 파일 ID입니다." });
      }
    });

    // ===========================
    // A-4. 업로드 + 문서 분석 + 스케줄 등록
    // ===========================

    app.post(
      "/upload-and-analyze",
      verifyToken,
      upload.single("file"),
      async (req, res) => {
        try {
          if (!req.file) {
            return res.status(400).json({ message: "파일이 전달되지 않았습니다." });
          }

          const userID = req.user.userID;
          const originalName = req.file.originalname;
          const filename = originalName;

          const uploadStream = gridfsBucket.openUploadStream(filename, {
            metadata: {
              userID,
              type: "contract",
            },
            contentType: req.file.mimetype,
          });

          uploadStream.end(req.file.buffer);

          uploadStream.on("error", (err) => {
            console.error("업로드 중 에러:", err);
            return res.status(500).json({ message: "파일 업로드 중 오류" });
          });

          uploadStream.on("finish", async () => {
            const fileId = uploadStream.id;
            console.log("✅ 파일 업로드 완료 (upload-and-analyze):", fileId.toString());

            const dangerScore = Math.floor(Math.random() * 101);
            const resultText =
              `이 문서는 자동 분석된 테스트 결과입니다.\n` +
              `위험도 점수: ${dangerScore}점.\n` +
              `※ 실제 서비스에서는 AI 모델이 조항을 분석하도록 확장 가능.`;

            const nextDocID = await getNextId(DocAnalysis, "docID");

            const doc = await DocAnalysis.create({
              docID: nextDocID,
              userID,
              fileId,
              result: resultText,
              danger: dangerScore,
            });

            const clientAlertAt = req.body.alertAt
              ? new Date(req.body.alertAt)
              : new Date(Date.now() + 24 * 60 * 60 * 1000);

            const nextScheduleID = await getNextId(Schedule, "scheduleID");

            const schedule = await Schedule.create({
              scheduleID: nextScheduleID,
              userID,
              docID: nextDocID,
              alertAt: clientAlertAt,
              message: `문서 분석 결과 확인 알림 - 문서 ID: ${nextDocID}`,
            });

            return res.json({
              message: "파일 업로드 + 분석 + 스케줄 등록 완료",
              file: {
                fileId,
                filename,
              },
              analysis: doc,
              schedule,
            });
          });
        } catch (err) {
          console.error(err);
          return res.status(500).json({ message: "서버 내부 오류" });
        }
      }
    );

    // ===========================
    // B. 게시글 / 좋아요
    // ===========================

    // B-1) 게시글 목록 (최신순 / 좋아요순)
    app.get("/posts", async (req, res) => {
      try {
        const sortType = req.query.sort;
        let sortOption = { createdAt: -1 };

        if (sortType === "likes") {
          sortOption = { likesCount: -1, createdAt: -1 };
        }

        const posts = await Post.find({}).sort(sortOption).lean();

        res.json(
          posts.map((p) => ({
            postID: p.postID,
            userID: p.userID,
            authorName: p.authorName,
            title: p.title,
            content: p.content,
            relatedFileId: p.relatedFileId,
            likesCount: p.likesCount,
            createdAt: p.createdAt,
          }))
        );
      } catch (err) {
        console.error(err);
        res.status(500).json({ message: "게시글 목록 조회 중 오류" });
      }
    });

    // B-2) 게시글 상세
    app.get("/posts/:postID", async (req, res) => {
      try {
        const postID = Number(req.params.postID);
        const post = await Post.findOne({ postID }).lean();

        if (!post) {
          return res.status(404).json({ message: "게시글을 찾을 수 없습니다." });
        }

        res.json(post);
      } catch (err) {
        console.error(err);
        res.status(500).json({ message: "게시글 조회 중 오류" });
      }
    });

    // B-3) 게시글 작성
    app.post("/posts", verifyToken, async (req, res) => {
      try {
        const { title, content, relatedFileId } = req.body;
        if (!title || !content) {
          return res.status(400).json({ message: "제목과 내용을 입력하세요." });
        }

        const userID = req.user.userID;
        const authorName = req.user.name;
        const nextPostID = await getNextId(Post, "postID");

        const post = await Post.create({
          postID: nextPostID,
          userID,
          authorName,
          title,
          content,
          relatedFileId: relatedFileId || null,
        });

        res.json({
          message: "게시글 작성 성공",
          post,
        });
      } catch (err) {
        console.error(err);
        res.status(500).json({ message: "게시글 작성 중 오류" });
      }
    });

    // B-4) 게시글 수정 (작성자 또는 admin)
    app.put("/posts/:postID", verifyToken, async (req, res) => {
      try {
        const postID = Number(req.params.postID);
        const { title, content, relatedFileId } = req.body;

        const post = await Post.findOne({ postID });
        if (!post) {
          return res.status(404).json({ message: "게시글을 찾을 수 없습니다." });
        }

        if (post.userID !== req.user.userID && req.user.role !== "admin") {
          return res.status(403).json({ message: "수정 권한이 없습니다." });
        }

        if (title) post.title = title;
        if (content) post.content = content;
        if (relatedFileId !== undefined) post.relatedFileId = relatedFileId;

        await post.save();

        res.json({ message: "게시글 수정 완료", post });
      } catch (err) {
        console.error(err);
        res.status(500).json({ message: "게시글 수정 중 오류" });
      }
    });

    // B-5) 게시글 삭제 (작성자 또는 admin)
    app.delete("/posts/:postID", verifyToken, async (req, res) => {
      try {
        const postID = Number(req.params.postID);
        const post = await Post.findOne({ postID });

        if (!post) {
          return res.status(404).json({ message: "게시글을 찾을 수 없습니다." });
        }

        if (post.userID !== req.user.userID && req.user.role !== "admin") {
          return res.status(403).json({ message: "삭제 권한이 없습니다." });
        }

        await Post.deleteOne({ postID });
        await Comment.deleteMany({ postID });

        res.json({ message: "게시글 삭제 완료" });
      } catch (err) {
        console.error(err);
        res.status(500).json({ message: "게시글 삭제 중 오류" });
      }
    });

    // B-6) 게시글 좋아요 토글
    app.post("/posts/:postID/like", verifyToken, async (req, res) => {
      try {
        const postID = Number(req.params.postID);
        const userID = req.user.userID;

        const post = await Post.findOne({ postID });
        if (!post) {
          return res.status(404).json({ message: "게시글을 찾을 수 없습니다." });
        }

        const hasLiked = post.likedUsers.includes(userID);

        if (hasLiked) {
          post.likedUsers = post.likedUsers.filter((id) => id !== userID);
          post.likesCount = Math.max(0, post.likesCount - 1);
        } else {
          post.likedUsers.push(userID);
          post.likesCount += 1;
        }

        await post.save();

        res.json({
          message: hasLiked ? "좋아요 취소" : "좋아요 추가",
          likesCount: post.likesCount,
        });
      } catch (err) {
        console.error(err);
        res.status(500).json({ message: "좋아요 처리 중 오류" });
      }
    });

    // ===========================
    // C. 댓글 + 대댓글 + 댓글 좋아요
    // ===========================

    // C-1) 댓글 목록
    // /posts/:postID/comments?sort=likes → 좋아요순
    app.get("/posts/:postID/comments", async (req, res) => {
      try {
        const postID = Number(req.params.postID);
        const sortType = req.query.sort;

        let sortOption = { createdAt: 1, commentID: 1 }; // 기본: 작성 순
        if (sortType === "likes") {
          sortOption = { likesCount: -1, createdAt: 1 }; // 👍 좋아요 많은 순
        }

        const comments = await Comment.find({ postID })
          .sort(sortOption)
          .lean();

        res.json(
          comments.map((c) => ({
            commentID: c.commentID,
            postID: c.postID,
            userID: c.userID,
            authorName: c.authorName,
            content: c.content,
            parentCommentID: c.parentCommentID,
            likesCount: c.likesCount,
            createdAt: c.createdAt,
          }))
        );
      } catch (err) {
        console.error(err);
        res.status(500).json({ message: "댓글 목록 조회 중 오류" });
      }
    });

    // C-2) 댓글 작성 (대댓글 포함)
    app.post("/posts/:postID/comments", verifyToken, async (req, res) => {
      try {
        const postID = Number(req.params.postID);
        const { content, parentCommentID } = req.body;

        if (!content) {
          return res.status(400).json({ message: "댓글 내용을 입력하세요." });
        }

        const post = await Post.findOne({ postID });
        if (!post) {
          return res.status(404).json({ message: "게시글을 찾을 수 없습니다." });
        }

        const userID = req.user.userID;
        const authorName = req.user.name;
        const nextCommentID = await getNextId(Comment, "commentID");

        const comment = await Comment.create({
          commentID: nextCommentID,
          postID,
          userID,
          authorName,
          content,
          parentCommentID: parentCommentID ?? null,
        });

        res.json({
          message: "댓글 작성 성공",
          comment,
        });
      } catch (err) {
        console.error(err);
        res.status(500).json({ message: "댓글 작성 중 오류" });
      }
    });

    // C-3) 댓글 수정
    app.put(
      "/posts/:postID/comments/:commentID",
      verifyToken,
      async (req, res) => {
        try {
          const commentID = Number(req.params.commentID);
          const { content } = req.body;

          const comment = await Comment.findOne({ commentID });
          if (!comment) {
            return res
              .status(404)
              .json({ message: "댓글을 찾을 수 없습니다." });
          }

          if (
            comment.userID !== req.user.userID &&
            req.user.role !== "admin"
          ) {
            return res.status(403).json({ message: "수정 권한이 없습니다." });
          }

          if (content) comment.content = content;
          await comment.save();

          res.json({ message: "댓글 수정 완료", comment });
        } catch (err) {
          console.error(err);
          res.status(500).json({ message: "댓글 수정 중 오류" });
        }
      }
    );

    // C-4) 댓글 삭제
    app.delete(
      "/posts/:postID/comments/:commentID",
      verifyToken,
      async (req, res) => {
        try {
          const commentID = Number(req.params.commentID);

          const comment = await Comment.findOne({ commentID });
          if (!comment) {
            return res
              .status(404)
              .json({ message: "댓글을 찾을 수 없습니다." });
          }

          if (
            comment.userID !== req.user.userID &&
            req.user.role !== "admin"
          ) {
            return res.status(403).json({ message: "삭제 권한이 없습니다." });
          }

          await Comment.deleteOne({ commentID });
          await Comment.deleteMany({ parentCommentID: commentID });

          res.json({ message: "댓글 삭제 완료" });
        } catch (err) {
          console.error(err);
          res.status(500).json({ message: "댓글 삭제 중 오류" });
        }
      }
    );

    // C-5) 댓글 좋아요 토글 (🔥 여기 추가)
    // POST /posts/:postID/comments/:commentID/like
    app.post(
      "/posts/:postID/comments/:commentID/like",
      verifyToken,
      async (req, res) => {
        try {
          const commentID = Number(req.params.commentID);
          const userID = req.user.userID;

          const comment = await Comment.findOne({ commentID });
          if (!comment) {
            return res
              .status(404)
              .json({ message: "댓글을 찾을 수 없습니다." });
          }

          const hasLiked = comment.likedUsers.includes(userID);

          if (hasLiked) {
            // 좋아요 취소
            comment.likedUsers = comment.likedUsers.filter(
              (id) => id !== userID
            );
            comment.likesCount = Math.max(0, comment.likesCount - 1);
          } else {
            // 좋아요 추가
            comment.likedUsers.push(userID);
            comment.likesCount += 1;
          }

          await comment.save();

          res.json({
            message: hasLiked ? "댓글 좋아요 취소" : "댓글 좋아요 추가",
            likesCount: comment.likesCount,
          });
        } catch (err) {
          console.error(err);
          res.status(500).json({ message: "댓글 좋아요 처리 중 오류" });
        }
      }
    );

    // ===========================
    // 서버 실행
    // ===========================
    app.listen(PORT, () => {
      console.log(`🚀 통합 서버 실행 중: http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error("서버 시작 중 오류:", err);
  }
}

startServer();
