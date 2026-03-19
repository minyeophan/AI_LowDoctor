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