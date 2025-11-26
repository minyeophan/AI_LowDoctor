// backend/src/app.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import swaggerUi from "swagger-ui-express";
import swaggerJsdoc from "swagger-jsdoc";
import uploadRoutes from "./routes/upload_routes.js";
import resultRoutes from "./routes/result_routes.js";

// 환경변수 로드
dotenv.config();

const app = express();

// MongoDB 연결
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log(`✅ MongoDB Connected`);
    console.log(`📊 Database: ${mongoose.connection.name}`);
  })
  .catch((error) => {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    process.exit(1);
  });

// ========== MongoDB 스키마 정의 ==========
const lawRefSchema = new mongoose.Schema({
  name: { type: String, required: true },
  article: { type: String, required: true },
  url: { type: String, required: true }
}, { _id: false });

const riskItemSchema = new mongoose.Schema({
  id: { type: Number, required: true },
  clauseText: { type: String, required: true },
  riskLevel: { 
    type: String, 
    enum: ['high', 'medium', 'low'],
    required: true 
  },
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
  documentId: { 
    type: String, 
    required: true,
    unique: true,
    index: true 
  },
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
  forms: [formSchema],
  
  // 처리 상태
  status: { 
    type: String, 
    enum: ['uploaded', 'processing', 'completed', 'failed'],
    default: 'uploaded'
  },
  errorMessage: { type: String },
  
  // 타임스탬프
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// 업데이트 시 updatedAt 자동 갱신
analysisSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// 모델 생성 및 export (controllers에서 사용)
export const Analysis = mongoose.model('Analysis', analysisSchema);

// 미들웨어 설정
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Swagger 설정
const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "AI Legal Doctor API",
      version: "1.0.0",
      description: "AI 기반 부동산 계약서 위험 분석 API",
      contact: {
        name: "AI Legal Doctor Team",
      },
    },
    servers: [
      {
        url: "http://localhost:3001",
        description: "개발 서버",
      },
    ],
  },
  apis: ["./src/routes/*.js"], // routes 파일에서 Swagger 주석 읽기
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

// Swagger UI 라우트
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// 기본 루트 테스트용 GET
app.get("/", (req, res) => {
  res.json({ 
    msg: "AI Legal Doctor Backend OK",
    docs: "http://localhost:3001/api-docs"
  });
});

// 업로드 라우트 연결
app.use("/api", uploadRoutes);

// 결과 조회 라우트 연결
app.use("/api", resultRoutes);

// AI 분석 요청용 POST 엔드포인트 (예시 구조)
app.post("/api/analyze-text", (req, res) => {
  const { text } = req.body;
  if (!text) {
    return res.status(400).json({
      status: "error",
      message: "분석할 텍스트(text)가 필요합니다.",
    });
  }

  // 예시 응답 (팀원들이 이 구조에 맞춰 분석 결과 반환하면 됨)
  const exampleResponse = {
    status: "success",
    message: "분석 완료",
    data: {
      summary: "자동갱신 및 위약금 조항이 포함된 계약입니다.",
      riskItems: [
        {
          id: 1,
          clauseText: "본 계약은 별도 해지 통보가 없을 시 자동 갱신된다.",
          riskLevel: "high",
          reason: "해지 통보 기한이 명시되지 않아 임차인에게 불리할 수 있음.",
          lawRefs: [
            {
              name: "주택임대차보호법",
              article: "제6조의3",
              url: "https://www.law.go.kr/..."
            }
          ],
          guide: "계약서에 '○개월 전 통보' 문구 명시 권장"
        }
      ],
      forms: [
        {
          type: "계약 해지 통보서",
          description: "전세 계약 해지를 통보할 때 사용하는 양식",
          downloadUrl: "https://example.com/forms/termination.hwp"
        }
      ]
    }
  };

  res.json(exampleResponse);
});

// 404 에러 핸들러
app.use((req, res) => {
  res.status(404).json({
    status: "error",
    message: "요청한 리소스를 찾을 수 없습니다.",
  });
});

// 서버 실행
const PORT = 3001;
app.listen(PORT, () => {
  console.log(`✅ Backend server running on port ${PORT}`);
  console.log(`📚 Swagger docs: http://localhost:${PORT}/api-docs`);
});
