import { v4 as uuidv4 } from "uuid";
import { Analysis } from "../app.js";
import { analyzeWithPython } from "../services/ai_service.js";

export const uploadFile = async (req, res) => {
  try {
    const file = req.file;

    if (!file) {
      return res.status(400).json({ status: "error", message: "파일 없음" });
    }

    const documentId = uuidv4();

    console.log(`업로드 파일: ${file.originalname}`);

    await new Analysis({
      documentId,
      filename: file.filename,
      originalname: file.originalname,
      filePath: file.path,
      fileSize: file.size,
      mimetype: file.mimetype,
      status: "uploaded",
    }).save();

    res.status(200).json({ document_id: documentId });

    processAnalysis(documentId, file.path, file.mimetype);
  } catch (err) {
    console.error("업로드 오류:", err);
  }
};

async function processAnalysis(documentId, filePath, mimetype) {
  try {
    console.log(`분석 시작: ${documentId}`);

    await Analysis.updateOne({ documentId }, { status: "processing" });

    // Python analyzer.py 실행
    const result = await analyzeWithPython(filePath, mimetype);

    await Analysis.updateOne(
      { documentId },
      {
        summary: result.summary,
        riskItems: result.riskItems,
        status: "completed",
      }
    );

    console.log(`분석 완료: ${documentId}`);
    console.log("저장된 분석 결과:", {
      documentId,
      summary: result.summary,
      riskItems: result.riskItems
    });

  } catch (err) {
    console.error("분석 실패:", err);
    await Analysis.updateOne(
      { documentId },
      { status: "failed", errorMessage: err.message }
    );
  }
}
