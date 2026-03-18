import { Post } from "../schemas";

export const uploadPost = async (req, res, next) => {
    try {
        const post = await Post.create({
            content: req.body.content,
            UserID: req.user.id,
        });
        res.status(201).json(post);
    } catch (error) {
        console.error(error);
        next(error);
    }
};