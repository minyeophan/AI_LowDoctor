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

<<<<<<< HEAD
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
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // DOCX (워드)
    'text/plain',  // TXT 텍스트
  ];
=======
// 허용된 MIME 타입 및 확장자 목록 정의 (TXT 파일 추가됨)
const ALLOWED_MIMES = [
  "application/pdf",// PDF
  "application/x-pdf",                                                   // PDF (비표준)
  "image/jpeg",// JPG
  "image/jpg", // JPG
  "image/png", // PNG
  "application/x-hwp", // HWP (한글)
  "application/haansofthwp", // HWP (한글)
  "application/vnd.hancom.hwp",// HWP (한글)
  "application/vnd.hancom.hwpx", // HWPX (한글 2014+)
  "application/msword", // DOC (워드)
  "application/vnd.openxmlformats-officedocument.wordprocesSsingml.document",// DOCX (워드)
  "text/plain" // 텍스트 파일 (.txt) 
];
>>>>>>> origin/develop

const ALLOWED_EXTS = ['.pdf', '.jpg', '.jpeg', '.png', '.hwp', '.hwpx', '.doc', '.docx', '.txt']; // ❗ .txt 추가


// 파일 필터 (PDF, 이미지, 한글, 워드, 텍스트 허용)
const fileFilter = (req, file, cb) => {
  const mimeCheck = ALLOWED_MIMES.includes(file.mimetype);
  const ext = path.extname(file.originalname).toLowerCase();
  const extCheck = ALLOWED_EXTS.includes(ext);
  
  // MIME 타입이 허용되거나 (OR) 확장자가 허용될 경우 통과
  if (mimeCheck || extCheck) {
    cb(null, true); 
  } else {
<<<<<<< HEAD
    // 확장자로도 체크 (일부 브라우저에서 MIME 타입이 정확하지 않을 수 있음)
    const ext = path.extname(file.originalname).toLowerCase();
    const allowedExts = ['.pdf', '.jpg', '.jpeg', '.png', '.hwp', '.hwpx', '.doc', '.docx','txt'];
    
    if (allowedExts.includes(ext)) {
      cb(null, true); // 확장자로 허용
    } else {
      cb(
        new Error("지원하지 않는 파일 형식입니다. PDF, JPG, PNG, HWP, HWPX, DOC, DOCX, txt만 가능합니다."),
        false
      );
    }
=======
    // MIME 타입도 확장자도 일치하지 않는 경우 거부
    const errorMessage = `지원하지 않는 파일 형식입니다. ${ALLOWED_EXTS.join(', ').toUpperCase()} 파일만 가능합니다. (MIME: ${file.mimetype})`;
    cb(new Error(errorMessage), false);
>>>>>>> origin/develop
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