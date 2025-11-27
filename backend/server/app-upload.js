// app-upload.js
require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const multer = require("multer");
const cors = require("cors");

const app = express();
const PORT = 4000;

// MongoDB Atlas URI (.env에 설정)
const mongoURI = process.env.MONGODB_URI;

// multer: 파일을 메모리에 올려두고 req.file.buffer 로 다룸
const upload = multer({ storage: multer.memoryStorage() });

let gridfsBucket;

// 서버 시작 함수
async function startServer() {
  try {
    // 1) MongoDB 연결
    await mongoose.connect(mongoURI);
    console.log("✅ MongoDB 연결 완료 (upload)");

    // 2) GridFSBucket 준비 (contracts 라는 버킷 사용)
    gridfsBucket = new mongoose.mongo.GridFSBucket(mongoose.connection.db, {
      bucketName: "contracts", // contracts.files / contracts.chunks 컬렉션 생성
    });
    console.log("✅ GridFSBucket 준비 완료 (contracts)");

    // 3) 미들웨어 설정
    app.use(express.json());
    app.use(cors()); // 브라우저에서 fetch 허용

    // 0) 홈 테스트용
    app.get("/", (req, res) => {
      res.send("AI 법률 닥터 파일 업로드 서버 동작 중!");
    });

    /**
     * 1) 파일 업로드
     * POST /upload
     * Body → form-data → userID(text), file(file)
     */
    app.post("/upload", upload.single("file"), (req, res) => {
      try {
        if (!req.file) {
          return res.status(400).json({ message: "파일이 전달되지 않았습니다." });
        }

        // 폼에서 전달된 userID (없으면 test001)
        const userID = req.body?.userID || "test001";
        const originalName = req.file.originalname;

        // 파일 이름을 원래 이름 그대로 사용
        const filename = originalName;

        // GridFS에 업로드 스트림 열기
        const uploadStream = gridfsBucket.openUploadStream(filename, {
          metadata: {
            userID, // 한 사용자가 여러 개 파일 업로드 가능 (1:N)
            type: "contract",
          },
          contentType: req.file.mimetype,
        });

        // 에러 처리
        uploadStream.on("error", (err) => {
          console.error("업로드 중 에러:", err);
          return res.status(500).json({ message: "파일 업로드 중 오류" });
        });

        // 업로드 완료 시
        uploadStream.on("finish", () => {
          const fileId = uploadStream.id; // ObjectId
          console.log("✅ 파일 업로드 완료:", fileId.toString());

          return res.json({
            message: "파일 업로드 성공",
            fileId,
            filename,
            metadata: { userID, type: "contract" },
          });
        });

        // 실제 바이너리 데이터 쓰기
        uploadStream.end(req.file.buffer);
      } catch (err) {
        console.error(err);
        return res.status(500).json({ message: "서버 내부 오류" });
      }
    });

    /**
     * 2) 파일 목록 조회
     * GET /files
     * 예) /files?userID=test001 → 해당 사용자의 파일만
     */
    app.get("/files", async (req, res) => {
      try {
        const userID = req.query.userID;

        const query = userID
          ? { "metadata.userID": userID } // 특정 유저의 파일만
          : {};                           // 전체 파일

        const cursor = gridfsBucket.find(query);
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

    /**
     * 3) 파일 다운로드
     * GET /file/:id
     * 예) /file/691e9788c0d3b9be71cc1d97
     */
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

    /**
     * 4) 파일 삭제 (옵션)
     * DELETE /file/:id
     */
    app.delete("/file/:id", async (req, res) => {
      try {
        const { ObjectId } = mongoose.Types;
        const fileId = new ObjectId(req.params.id);
        await gridfsBucket.delete(fileId);
        res.json({ message: "파일 삭제 완료" });
      } catch (err) {
        console.error(err);
        res.status(400).json({ message: "파일 삭제 중 오류" });
      }
    });

    // 서버 실행
    app.listen(PORT, () => {
      console.log(`🚀 파일 업로드 서버 실행 중: http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error("서버 시작 중 오류:", err);
  }
}

startServer();
