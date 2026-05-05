import Upload from "../schemas/upload_db.js";
import Analysis from "../schemas/analyze_db.js";
import Result from "../schemas/result_db.js";

const formatDate = (dateValue) => {
    if (!dateValue) return "";
    const date = new Date(dateValue);
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const dd = String(date.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
};

const resolveAnalysisStatus = (status) => {
    const statusMap = {
        processing: "분석 중",
        completed: "분석 완료",
        failed: "분석 실패",
    };
    return statusMap[status] || "미분석";
};

export const getMyPageList = async (req, res, next) => {
    try {
        const { category = "draft", sort = "recent", contractType = "" } = req.query;

        if (!req.user) {
            return res.status(401).json({ message: "로그인이 필요합니다." });
        }
        const currentUserID = req.user.userID;

        const sortOption = sort === "name" ? { originalname: 1 } :
                            sort === "old" ? { createdAt: 1 } : { createdAt: -1 };

        const query = { userID: req.user.userID };

        if (contractType && contractType !== "전체") {
            query.contractType = contractType;
        }

        const uploads = await Upload.find(query).sort(sortOption).lean();

        const items = await Promise.all(
            uploads.map(async (file) => {
                const analysis = await Analysis.findOne({ documentId: file.documentId }).lean();

                if (category === "draft") {
                    // 작성 중: isSaved가 false인 것만
                    if (file.isSaved === true) return null;

                    return {
                        documentId: file.documentId,
                        contractType: file.contractType || "부동산",
                        title: file.originalname,
                        updatedAt: formatDate(file.updatedAt),
                        progress: analysis?.progress || 0,
                        statusText: resolveAnalysisStatus(analysis?.status)
                    };
                } else {
                    // 보관함: isSaved가 true인 것만
                    if (file.isSaved !== true) return null;

                    return {
                        documentId: file.documentId,
                        contractType: "부동산",
                        title: file.originalname,
                        UploadDate: formatDate(file.createdAt),
                        analysisStatus: resolveAnalysisStatus(analysis?.status),
                    };
                }
            })
        );

        let filteredList = items.filter(item => item !== null);
    
        if (contractType && contractType !== "전체") {
            filteredList = filteredList.filter(item => item.contractType === contractType);
        }

        return res.status(200).json({
            category: category === "draft" ? "작성 중" : "보관함",
            total: filteredList.length,
            list: filteredList
        });
    } catch (error) {
        console.error("마이페이지 조회 에러: ", error);
        next(error);
    }
};

export const saveDocumentToArchive = async (req, res, next) => {
    try {
        if (!req.user) {
            return res.status(401).json({ message: "로그인이 필요합니다." });
        }

        const { documentId } = req.body;

        if (!documentId) {
            return res.status(400).json({ message: "documentId가 필요합니다." });
        }

        // 문서 존재 확인
        const upload = await Upload.findOne({ documentId });
        if (!upload) {
            return res.status(404).json({ message: "문서를 찾을 수 없습니다." });
        }

        // Upload 문서에 userID, isSaved 추가 (분석 여부와 무관하게 저장)
        await Upload.updateOne(
            { documentId },
            {
                userID: req.user.userID,
                isSaved: true
            }
        );

        console.log(`문서 저장 완료 [${documentId}] (사용자: ${req.user.userID})`);

        return res.status(200).json({
            message: "문서가 보관함에 저장되었습니다.",
            documentId,
            saved: true
        });
    } catch (error) {
        console.error("문서 저장 에러:", error);
        next(error);
    }
};