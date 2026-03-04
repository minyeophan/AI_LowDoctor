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
        
        const saved = await Upload.create({
            documentId,
            filename: file.filename,
            originalname: file.originalname,
            filePath: file.path,
            fileSize: file.size,
            mimetype: file.mimetype,
            createdAt: new Date()
        });
        
        res.status(200).json({
            message: '업로드 및 DB 저장 완료',
            document_id: documentId,
            status: 'uploaded',
            data: saved,
        });
    } catch (error) {
        console.error(error);
        next(error);
    }
};