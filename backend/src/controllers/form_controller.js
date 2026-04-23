import axios from "axios";
import Form from "../schemas/form_db.js";
import User from "../schemas/user_db.js";

const formatDate = (dateValue) => {
    if (!dateValue) return "";
    const date = new Date(dateValue);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
};

export const getForms = async (req, res, next) => {
    try {
        const { category, keyword } = req.query;
        const query = {};

        if (category && category !== "전체") query.category = category;
        if (keyword) query.form_name = { $regex: keyword, $options: "i" };

        const forms = await Form.find(query).sort({ createdAt: -1 }).lean();

        const result = forms.map(form => ({
            formId: form._id,
            fomr_name: form.form_name,
            category: form.category,
            source: "대한법률구조공단",
            save_date: formatDate(form.createdAt),
            downloadCount: form.downloadCount
        }));
        
        res.status(200).json(result);
    } catch (error) {
        console.error(error);
        next(error);
    }
};

export const downloadForm = async (req, res, next) => {
    try {
        if (!req.user) return res.status(401).json({ message: "로그인이 필요합니다." });

        const { id } = req.params;
        const [user, form] = await Promise.all([
            User.findById(req.user._id),
            Form.findById(id)
        ]);

        if (!user || !form) return res.status(404).json({ message: "데이터를 찾을 수 없습니다."});

        const targetUrl = form.fileUrl;
        const fileName = `${form.form_name}.hwp`;

        const response = await axios({
            url: targetUrl,
            method: 'GET',
            responseType: 'stream',
            timeout: 15000,
        });

        res.setHeader('Content-Disposition', `attachment; filename=${encodeURIComponent(fileName)}`);
        res.setHeader('Content-Type', 'application/octet-stream');

        const isAlreadySaved = user.savedForms.some(item => item.formId?.toString() === id);
        if (!isAlreadySaved) {
            user.savedForms.push({ formId: id, save_date: new Date() });
            await user.save();
            form.downloadCount += 1;
            await form.save();
        }

        response.data.pipe(res);
    } catch (error) {
        console.error("다운로드 실패: ", error.message);
        if (!res.headersSent) {
            res.status(500).json({ message: "파일을 가져오는 중 오류가 발생했습니다." });
        }
    }
};