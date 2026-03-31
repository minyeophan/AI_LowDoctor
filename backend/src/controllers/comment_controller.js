import mongoose from "mongoose";
import Comment from "../schemas/comment_db.js";
import Post from "../schemas/post_db.js";
import User from "../schemas/user_db.js";

const { Types } = mongoose;

const safeString = (value = "") => String(value).trim();

const formatDate = (dateValue) => {
  if (!dateValue) return "";

  const date = new Date(dateValue);
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  const hh = String(date.getHours()).padStart(2, "0");
  const min = String(date.getMinutes()).padStart(2, "0");

  return `${yyyy}-${mm}-${dd} ${hh}:${min}`;
};

const maskName = (name = "") => {
  const trimmed = safeString(name);
  if (!trimmed) return "익명";
  if (trimmed.length === 1) return trimmed;
  return trimmed[0] + "*".repeat(Math.max(1, trimmed.length - 1));
};

const resolveAuthorName = async (doc) => {
  if (doc?.userRef?.name) {
    return doc.userRef.name;
  }

  if (doc?.userID) {
    const user = await User.findOne({ userID: doc.userID }).select("name");
    return user?.name || "익명";
  }

  return "익명";
};

const serializeComment = async (commentDoc) => {
  const authorName = await resolveAuthorName(commentDoc);

  return {
    id: commentDoc._id.toString(),
    postId: commentDoc.postId.toString(),
    author: maskName(authorName),
    content: commentDoc.content,
    date: formatDate(commentDoc.createdAt),
    likes: Array.isArray(commentDoc.likes) ? commentDoc.likes.length : 0,
  };
};

const isCommentOwner = (comment, req) => {
  const reqUserID = req.user?.userID || null;
  const reqUserRef = req.user?._id?.toString() || null;

  const commentUserID =
    comment.userID?.toString?.() || String(comment.userID || "");
  const commentUserRef =
    comment.userRef?._id?.toString?.() ||
    comment.userRef?.toString?.() ||
    String(comment.userRef || "");

  return (
    (reqUserID && commentUserID && reqUserID === commentUserID) ||
    (reqUserRef && commentUserRef && reqUserRef === commentUserRef)
  );
};

/**
 * 특정 게시글 댓글 목록 조회
 * GET /api/posts/:id/comments
 */
export const getPostComments = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        message: "유효하지 않은 게시글 ID입니다.",
      });
    }

    const postExists = await Post.exists({ _id: id });
    if (!postExists) {
      return res.status(404).json({
        message: "게시글 없음",
      });
    }

    const comments = await Comment.find({ postId: id })
      .populate("userRef", "name")
      .sort({ createdAt: 1 });

    const response = await Promise.all(comments.map(serializeComment));

    return res.status(200).json(response);
  } catch (error) {
    console.error("getPostComments error:", error);
    next(error);
  }
};

/**
 * 댓글 작성
 * POST /api/posts/:id/comments
 */
export const createComment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const content = safeString(req.body.content);

    if (!req.user) {
      return res.status(401).json({
        message: "로그인이 필요합니다.",
      });
    }

    if (!content) {
      return res.status(400).json({
        message: "댓글 내용을 입력해주세요.",
      });
    }

    if (!Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        message: "유효하지 않은 게시글 ID입니다.",
      });
    }

    const post = await Post.findById(id);
    if (!post) {
      return res.status(404).json({
        message: "게시글 없음",
      });
    }

    const comment = await Comment.create({
      postId: post._id,
      userRef: req.user._id,
      userID: req.user.userID,
      content,
      likes: [],
    });

    const populatedComment = await Comment.findById(comment._id).populate(
      "userRef",
      "name"
    );

    return res.status(201).json(await serializeComment(populatedComment));
  } catch (error) {
    console.error("createComment error:", error);
    next(error);
  }
};

/**
 * 기존 이름 호환용
 */
export const uploadComment = createComment;

/**
 * 댓글 수정
 * PATCH /api/comments/:id
 */
export const updateComment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const content = safeString(req.body.content);

    const comment = await Comment.findById(id).populate("userRef", "name");

    if (!comment) {
      return res.status(404).json({ message: "댓글 없음" });
    }

    if (!isCommentOwner(comment, req)) {
      return res.status(403).json({ message: "권한 없음" });
    }

    if (content) {
      comment.content = content;
    }

    await comment.save();

    const updatedComment = await Comment.findById(comment._id).populate(
      "userRef",
      "name"
    );

    return res.status(200).json(await serializeComment(updatedComment));
  } catch (error) {
    console.error("updateComment error:", error);
    next(error);
  }
};

/**
 * 댓글 삭제
 * DELETE /api/comments/:id
 */
export const deleteComment = async (req, res, next) => {
  try {
    const comment = await Comment.findById(req.params.id).populate(
      "userRef",
      "name"
    );

    if (!comment) {
      return res.status(404).json({ message: "댓글 없음" });
    }

    if (!isCommentOwner(comment, req)) {
      return res.status(403).json({ message: "권한 없음" });
    }

    await Comment.findByIdAndDelete(req.params.id);

    return res.json({ message: "삭제 완료" });
  } catch (error) {
    console.error("deleteComment error:", error);
    next(error);
  }
};

/**
 * 댓글 좋아요 토글
 * POST /api/comments/:id/like
 */
export const likeComment = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "로그인이 필요합니다." });
    }

    const comment = await Comment.findById(req.params.id);

    if (!comment) {
      return res.status(404).json({ message: "댓글 없음" });
    }

    const currentUserID = req.user.userID;
    const isLiked = comment.likes.includes(currentUserID);

    if (isLiked) {
      comment.likes = comment.likes.filter((userID) => userID !== currentUserID);
    } else {
      comment.likes.push(currentUserID);
    }

    await comment.save();

    return res.status(200).json({
      liked: !isLiked,
      likes: comment.likes.length,
    });
  } catch (error) {
    console.error("likeComment error:", error);
    next(error);
  }
};

/**
 * 기존 이름 호환용
 */
export const toggleCommentLike = likeComment;

/**
 * 기존 이름 호환용
 * GET /api/posts/:id/comments 와 동일 의미
 */
export const categoryComment = getPostComments;