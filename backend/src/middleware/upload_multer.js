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
    // 한글 파일명 깨짐 방지: Buffer를 사용해 올바른 인코딩으로 변환
    const originalname = Buffer.from(file.originalname, 'latin1').toString('utf8');
    
    // 중복 방지를 위한 타임스탬프 추가
    const uniqueSuffix = Date.now();
    const ext = path.extname(originalname);
    const basename = path.basename(originalname, ext);
    
    // 파일명: 원본파일명_타임스탬프.확장자
    cb(null, `${basename}_${uniqueSuffix}${ext}`);
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
