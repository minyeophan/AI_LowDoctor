import { v4 as uuidv4 } from "uuid";
import Upload from "../schemas/upload_db.js";

export const afterUpload = async (req, res, next) => {
    console.log(req.file);

    try {
        const file = req.file;
        if (!file) {
            return res.status(400).json({ message: '파일이 없습니다.' });
        }

        const documentId = uuidv4();
        const userID = req.user?.userID || null;  // 로그인한 사용자 ID (선택사항)

        const saved = await Upload.create({
            userID,
            documentId,
            filename: file.filename,
            originalname: Buffer.from(file.originalname, 'latin1').toString('utf8'),
            filePath: file.path,
            fileSize: file.size,
            mimetype: file.mimetype,
            contractType: "부동산",
            isSaved: false,
            createdAt: new Date()
        });
        res.status(200).json({
            message: '업로드 및 DB 저장 완료',
            documentId: documentId,
            status: 'uploaded',
            data: saved,
        });
    } catch (error) {
        console.error(error);
        next(error);
    }
};
