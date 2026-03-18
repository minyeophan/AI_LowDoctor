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

export const updatePost = async (req, res, next) => {
    try {
        const post = await Post.findById(req.params.id);

        if (!post) {
            return res.status(404).json({ message: "게시글 없음" });

        }

        if (post.userID.toString() !== req.user.id) {
            return res.status(403).json({ message: "권한 없음" });
        }

        post.content = req.body.content || post.content;

        await post.save();

        res.json(post);
    } catch (error) {
        console.error(error);
        next(error);
    }
};

export const deletePost = async (req, res, next) => {
    try {
        const post = await Post.findById(req.params.id);

        if (!post) {
            return res.status(404).json({ message: "게시글 없음" });
        }

        if (post.UserID.toString() !== req.user.id) {
            return res.status(403).json({ message: "권한 없음" });
        }

        await Post.findByIdAndDelete(req.params.id);

        res.json({ message: "삭제 완료" });
    } catch (error) {
        console.error(error);
        next(error);
    }
};