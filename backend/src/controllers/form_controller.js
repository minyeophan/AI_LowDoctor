import User from "../schemas/user_db.js";
import Form from "../schemas/form_db.js";

const formatDate = (dateValue) => {
    if (!dateValue) return "";
    const date = new Date(dateValue);
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const dd = String(date.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
};

export const getForms = async (req, res, next) => {
    try {
        const { category, keyword } = req.query;
        const query = {};

        if (category && category !== "전체") {
            query.category = category;
        }

        if (keyword) {
            query.form_name = { $regex: keyword, $options: "i" };
        }

        const forms = await Form.find(query)
            .sort({ createdAt: -1 })
            .lean();

        const result = forms.map(form => ({
            formId: form._id,
            form_name: form.form_name,
            category: form.category,
            source: form.source,
            save_date: formatDate(form.createdAt),
            downloadCount: form.downloadCount
        }));

        res.status(200).json(result);
    } catch (error) {
        console.log(error);
        next(error);
    }
};

export const downloadForm = async (req, res, next) => {
    try {
        if (!req.user) {
            return res.status(401).json({ message: "로그인이 필요합니다." });
        }

        const { id } = req.params;
        const user = await User.findById(req.user._id);

        if (!user) {
            return res.status(404).json({ message: "사용자를 찾을 수 없습니다." });
        }

        const form = await Form.findById(id);
        if (!form) {
            return res.status(404).json({ message: "해당 양식을 찾을 수 없습니다." });
        }

        const isAlreadySaved = user.savedForms.some(
            item => item.formId?.toString() === id
        );

        if (!isAlreadySaved) {
            user.savedForms.push({
                formId: id,
                save_date: new Date()
            });
            await user.save();

            form.downloadCount += 1;
            await form.save();
        }

        res.status(200).json({
            message: "다운로드가 완료되었습니다.",
            downloadUrl: form.fileUrl,
            fileName: form.form_name
        });
    } catch (error) {
        console.error("다운로드 에러: ", error);
        next(error);
    }
};