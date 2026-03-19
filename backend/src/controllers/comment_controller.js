import Comment from "../schemas/comment_db.js";

export const uploadComment = async (req, res, next) => {
    try {
        const comment = await Comment.create({
            commenter: req.body.id,
            comment: req.body.comment,
        });
        console.log(comment);
        const result = await Comment.populate(comment, { path: 'commenter' });
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

        if (comment.userID.toString() !== req.user.id) {
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