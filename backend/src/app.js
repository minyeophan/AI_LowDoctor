// backend/src/app.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import swaggerUi from "swagger-ui-express";
import swaggerJsdoc from "swagger-jsdoc";

// 라우트 및 컨트롤러
import uploadRoutes from "./routes/upload_routes.js";
import resultRoutes from "./routes/result_routes.js";
import { analyzeAndGetResult } from "./controllers/result_controller.js";

// Multer 미들웨어
import upload from "./middleware/upload_multer.js";

// 환경변수 로드
dotenv.config();

const app = express();

export const memoryStore = new Map();

// Analysis 클래스 (MongoDB 대신)
export class Analysis {
  constructor(data) {
    Object.assign(this, data);
    this.createdAt = new Date();
    this.updatedAt = new Date();
  }
  
  async save() {
    memoryStore.set(this.documentId, this);
    console.log("💾 메모리 저장 완료");
    return this;
  }
  
  static async findOneAndUpdate(query, update) {
    const doc = memoryStore.get(query.documentId);
    if (doc) {
      Object.assign(doc, update);
      doc.updatedAt = new Date();
      console.log("💾 메모리 업데이트 완료");
    }
    return doc;
  }
  
  static async findOne(query) {
    return memoryStore.get(query.documentId) || null;
  }
}

// =================== MongoDB 연결 ===================
// mongoose.connect(process.env.MONGODB_URI)
//   .then(() => {
//     console.log("✅ MongoDB Connected");
//     console.log(`📊 Database: ${mongoose.connection.name}`);
//   })
//   .catch((error) => {
//     console.error(`❌ MongoDB Connection Error: ${error.message}`);
//     process.exit(1);
//   });

// =================== MongoDB 스키마 정의 ===================
const lawRefSchema = new mongoose.Schema({
  name: { type: String, required: true },
  article: { type: String, required: true },
  url: { type: String, required: true }
}, { _id: false });

const riskItemSchema = new mongoose.Schema({
  id: { type: Number, required: true },
  clauseText: { type: String, required: true },
  riskLevel: { type: String, enum: ["high","medium","low"], required: true },
  reason: { type: String, required: true },
  lawRefs: [lawRefSchema],
  guide: { type: String, required: true }
}, { _id: false });

const formSchema = new mongoose.Schema({
  type: { type: String, required: true },
  description: { type: String, required: true },
  downloadUrl: { type: String, required: true }
}, { _id: false });

const analysisSchema = new mongoose.Schema({
  documentId: { type: String, required: true, unique: true, index: true },
  filename: { type: String, required: true },
  originalname: { type: String, required: true },
  filePath: { type: String, required: true },
  fileSize: { type: Number, required: true },
  mimetype: { type: String, required: true },

  // OCR 결과
  extractedText: { type: String },

  // AI 분석 결과
  summary: { type: String },
  riskItems: [riskItemSchema],

  // 상태 관리
  status: { type: String, enum: ["uploaded","processing","completed","failed"], default: "uploaded" },
  errorMessage: { type: String },

  // 타임스탬프
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// updatedAt 자동 갱신
analysisSchema.pre("save", function(next){
  this.updatedAt = Date.now();
  next();
});

// 모델
// export const Analysis = mongoose.model("Analysis", analysisSchema);

// =================== 미들웨어 ===================
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:3000'],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// =================== Swagger ===================
const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "AI Legal Doctor API",
      version: "1.0.0",
      description: "AI 기반 부동산 계약서 위험 분석 API",
      contact: { name: "AI Legal Doctor Team" }
    },
    servers: [{ url: "http://localhost:3001", description: "개발 서버" }]
  },
  apis: ["./src/routes/*.js"]
};
const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// =================== 기본 라우트 ===================
app.get("/", (req,res) => {
  res.json({
    msg: "AI Legal Doctor Backend OK",
    docs: "http://localhost:3001/api-docs"
  });
});

// =================== 업로드 & 결과 라우트 ===================
app.use("/api", uploadRoutes);   // 파일 업로드 라우트
app.use("/api", resultRoutes);   // 분석 결과 조회 라우트

// =================== 파일 업로드 후 OCR + AI 분석 ===================
// React에서 바로 파일 업로드 시 자동 분석
app.post("/api/document/analyze", upload.single("file"), analyzeAndGetResult);

// =================== 404 핸들러 ===================
app.use((req,res) => {
  res.status(404).json({
    status: "error",
    message: "요청한 리소스를 찾을 수 없습니다."
  });
});

// =================== 서버 실행 ===================
const PORT = 3001;
app.listen(PORT, () => {
  console.log(`✅ Backend server running on port ${PORT}`);
  console.log(`📚 Swagger docs: http://localhost:${PORT}/api-docs`);
});
