// backend/src/app.js
import express from "express";
import cors from "cors";
import swaggerUi from "swagger-ui-express";
import swaggerJsdoc from "swagger-jsdoc";
import uploadRoutes from "./routes/upload_routes.js";

const app = express();

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