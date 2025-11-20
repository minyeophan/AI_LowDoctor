// backend/src/middleware/upload_multer.js
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

// ES Module에서 __dirname 사용하기
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 업로드 폴더 경로 설정
const uploadDir = path.join(__dirname, "../../uploads");

// uploads 폴더가 없으면 생성
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
  console.log("✅ uploads 폴더 생성됨");
}

// Multer 저장 설정
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir); // 업로드 폴더
  },
  filename: (req, file, cb) => {
    // 파일명: 타임스탬프_원본파일명
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    const basename = path.basename(file.originalname, ext);
    cb(null, `${basename}-${uniqueSuffix}${ext}`);
  },
});

// 파일 필터 (PDF, 이미지, 한글, 워드 허용)
const fileFilter = (req, file, cb) => {
  const allowedMimes = [
    "application/pdf",                                                      // PDF
    "image/jpeg",                                                           // JPG
    "image/jpg",                                                            // JPG
    "image/png",                                                            // PNG
    "application/x-hwp",                                                    // HWP (한글)
    "application/haansofthwp",                                              // HWP (한글)
    "application/vnd.hancom.hwp",                                           // HWP (한글)
    "application/vnd.hancom.hwpx",                                          // HWPX (한글 2014+)
    "application/msword",                                                   // DOC (워드)
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document" // DOCX (워드)
  ];

  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true); // 허용
  } else {
    // 확장자로도 체크 (일부 브라우저에서 MIME 타입이 정확하지 않을 수 있음)
    const ext = path.extname(file.originalname).toLowerCase();
    const allowedExts = ['.pdf', '.jpg', '.jpeg', '.png', '.hwp', '.hwpx', '.doc', '.docx'];
    
    if (allowedExts.includes(ext)) {
      cb(null, true); // 확장자로 허용
    } else {
      cb(
        new Error("지원하지 않는 파일 형식입니다. PDF, JPG, PNG, HWP, HWPX, DOC, DOCX만 가능합니다."),
        false
      );
    }
  }
};

// Multer 설정
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 최대 10MB
  },
});

export default upload;