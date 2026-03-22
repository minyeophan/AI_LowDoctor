import Comment from "../schemas/comment_db.js";

export const uploadComment = async (req, res, next) => {
    try {
        if (!req.body.comment) {
            return res.status(400).json({ message: "댓글 내용 필요" });
        }

        const comment = await Comment.create({
            userID: req.user._id,
            comment: req.body.comment,
            postId: req.params.id,
        });
        console.log(comment);
        const result = await Comment.populate(comment, { path: 'userID' });
        res.status(201).json(result);
    } catch (error) {
        console.error(error);
        next(error);
    }
};

export const updateComment = async (req, res, next) => {
    try {
        const comment = await Comment.findById(req.params.id);

        if (!comment) {
            return res.status(404).json({ message: "댓글 없음" });
        }

        if (comment.userID.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: "권한 없음" });
        }

        if (req.body.comment !== undefined) {
            comment.comment = req.body.comment;
        }

        await comment.save();
        res.json(comment);
    } catch (error) {
        console.error(error);
        next(error);
    }
};

export const deleteComment = async (req, res, next) => {
    try {
        const comment = await Comment.findById(req.params.id);

        if (!comment) {
            return res.status(404).json({ message: "댓글 없음" });
        }

        if (comment.userID.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: "권한 없음" });
        }

        await Comment.findByIdAndDelete(req.params.id);

        res.json({ message: "삭제 완료" });
    } catch (error) {
        console.error(error);
        next(error);
    }
};