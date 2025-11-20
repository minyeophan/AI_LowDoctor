// backend/src/controllers/upload_controller.js
import { v4 as uuidv4 } from "uuid";

/**
 * 파일 업로드 처리 컨트롤러
 */
export const uploadFile = (req, res) => {
  try {
    // 파일 정보
    const file = req.file;
    
    // 고유 문서 ID 생성
    const documentId = uuidv4();

    // 업로드 성공 로그 (한글 파일명도 정상 출력)
    console.log(`✅ File uploaded: ${file.originalname} (${file.size} bytes)`);
    console.log(`📄 Document ID: ${documentId}`);
    console.log(`📁 Saved as: ${file.filename}`);
    console.log(`📂 Path: ${file.path}`);

    // 성공 응답
    return res.status(200).json({
      document_id: documentId,
      status: "uploaded"
    });

  } catch (error) {
    console.error("❌ Upload error:", error);
    
    // 에러 응답
    return res.status(400).json({
      status: "error",
      error_code: "UPLOAD_FAILED",
      message: "파일 업로드 실패",
    });
  }
};
