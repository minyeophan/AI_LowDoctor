import mongoose from "mongoose";
import Post from "../schemas/post_db.js";
import Comment from "../schemas/comment_db.js";
import User from "../schemas/user_db.js";

const { Types } = mongoose;

const safeString = (value = "") => String(value).trim();

const escapeRegExp = (value = "") =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

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

const getReqUserID = (req) => req.user?.userID || null;
const getReqUserRef = (req) => req.user?._id?.toString() || null;

const isPostOwner = (post, req) => {
  const reqUserID = getReqUserID(req);
  const reqUserRef = getReqUserRef(req);

  const postUserID = post.userID?.toString?.() || String(post.userID || "");
  const postUserRef =
    post.userRef?._id?.toString?.() ||
    post.userRef?.toString?.() ||
    String(post.userRef || "");

  return (
    (reqUserID && postUserID && reqUserID === postUserID) ||
    (reqUserRef && postUserRef && reqUserRef === postUserRef)
  );
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

const serializePost = async (postDoc) => {
  const authorName = await resolveAuthorName(postDoc);
  const commentsCount = await Comment.countDocuments({ postId: postDoc._id });

  return {
    id: postDoc._id.toString(),
    title: postDoc.title,
    content: postDoc.content,
    category: postDoc.category,
    author: maskName(authorName),
    date: formatDate(postDoc.createdAt),
    views: postDoc.views || 0,
    comments: commentsCount,
    likes: Array.isArray(postDoc.likes) ? postDoc.likes.length : 0,
  };
};

export const createPost = async (req, res, next) => {
  try {
    const title = safeString(req.body.title);
    const content = safeString(req.body.content);
    const category = safeString(req.body.category || "부동산");

    if (!req.user) {
      return res.status(401).json({ message: "로그인이 필요합니다." });
    }

    if (!title || !content) {
      return res.status(400).json({
        message: "제목과 내용은 필수입니다.",
      });
    }

    if (title.length > 60) {
      return res.status(400).json({
        message: "제목은 최대 60자까지 가능합니다.",
      });
    }

    const post = await Post.create({
      title,
      content,
      category,
      userRef: req.user._id,
      userID: req.user.userID,
      views: 0,
      likes: [],
    });

    const populatedPost = await Post.findById(post._id).populate("userRef", "name");

    return res.status(201).json(await serializePost(populatedPost));
  } catch (error) {
    console.error("createPost error:", error);
    next(error);
  }
};

export const uploadPost = createPost;

export const getPosts = async (req, res, next) => {
  try {
    const sort = safeString(req.query.sort || "latest");
    const category = safeString(req.query.category || "");
    const keyword = safeString(
      req.query.keyword || req.query.search || req.query.q || ""
    );

    const filter = {};

    if (category && category !== "전체") {
      filter.category = category;
    }

    if (keyword) {
      filter.title = {
        $regex: escapeRegExp(keyword),
        $options: "i",
      };
    }

    const posts = await Post.find(filter).populate("userRef", "name").lean();

    const mapped = await Promise.all(
      posts.map(async (post) => {
        const commentsCount = await Comment.countDocuments({ postId: post._id });
        const authorName = post.userRef?.name
          ? post.userRef.name
          : (
              await User.findOne({ userID: post.userID }).select("name").lean()
            )?.name || "익명";

        return {
          id: post._id.toString(),
          title: post.title,
          content: post.content,
          category: post.category,
          author: maskName(authorName),
          date: formatDate(post.createdAt),
          views: post.views || 0,
          comments: commentsCount,
          likes: Array.isArray(post.likes) ? post.likes.length : 0,
          _createdAt: new Date(post.createdAt).getTime(),
        };
      })
    );

    if (sort === "latest") {
      mapped.sort((a, b) => b._createdAt - a._createdAt);
    } else if (sort === "popular" || sort === "views") {
      mapped.sort((a, b) => b.views - a.views || b._createdAt - a._createdAt);
    } else if (sort === "comments") {
      mapped.sort((a, b) => b.comments - a.comments || b._createdAt - a._createdAt);
    } else {
      mapped.sort((a, b) => b._createdAt - a._createdAt);
    }

    const result = mapped.map(({ _createdAt, ...rest }) => rest);

    return res.status(200).json(result);
  } catch (error) {
    console.error("getPosts error:", error);
    next(error);
  }
};

export const getBestPost = async (req, res, next) => {
  try {
    const posts = await Post.find({}).populate("userRef", "name").lean();

    if (!posts.length) {
      return res.status(200).json(null);
    }

    const mapped = await Promise.all(
      posts.map(async (post) => {
        const commentsCount = await Comment.countDocuments({ postId: post._id });
        const authorName = post.userRef?.name
          ? post.userRef.name
          : (
              await User.findOne({ userID: post.userID }).select("name").lean()
            )?.name || "익명";

        return {
          id: post._id.toString(),
          title: post.title,
          content: post.content,
          category: post.category,
          author: maskName(authorName),
          date: formatDate(post.createdAt),
          views: post.views || 0,
          comments: commentsCount,
          likes: Array.isArray(post.likes) ? post.likes.length : 0,
          _createdAt: new Date(post.createdAt).getTime(),
        };
      })
    );

    mapped.sort((a, b) => {
      if (b.likes !== a.likes) return b.likes - a.likes;
      if (b.views !== a.views) return b.views - a.views;
      return b._createdAt - a._createdAt;
    });

    const { _createdAt, ...bestPost } = mapped[0];

    return res.status(200).json(bestPost);
  } catch (error) {
    console.error("getBestPost error:", error);
    next(error);
  }
};

export const getPostDetail = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "유효하지 않은 게시글 ID입니다." });
    }

    const post = await Post.findByIdAndUpdate(
      id,
      { $inc: { views: 1 } },
      { new: true }
    ).populate("userRef", "name");

    if (!post) {
      return res.status(404).json({ message: "게시글 없음" });
    }

    return res.status(200).json(await serializePost(post));
  } catch (error) {
    console.error("getPostDetail error:", error);
    next(error);
  }
};

export const updatePost = async (req, res, next) => {
  try {
    const { id } = req.params;
    const title = safeString(req.body.title || "");
    const content = safeString(req.body.content || "");
    const category = safeString(req.body.category || "");

    const post = await Post.findById(id).populate("userRef", "name");

    if (!post) {
      return res.status(404).json({ message: "게시글 없음" });
    }

    if (!isPostOwner(post, req)) {
      return res.status(403).json({ message: "권한 없음" });
    }

    if (title) {
      if (title.length > 60) {
        return res.status(400).json({
          message: "제목은 최대 60자까지 가능합니다.",
        });
      }
      post.title = title;
    }

    if (content) {
      post.content = content;
    }

    if (category) {
      post.category = category;
    }

    await post.save();

    const updatedPost = await Post.findById(post._id).populate("userRef", "name");

    return res.status(200).json(await serializePost(updatedPost));
  } catch (error) {
    console.error("updatePost error:", error);
    next(error);
  }
};

export const deletePost = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id).populate("userRef", "name");

    if (!post) {
      return res.status(404).json({ message: "게시글 없음" });
    }

    if (!isPostOwner(post, req)) {
      return res.status(403).json({ message: "권한 없음" });
    }

    await Comment.deleteMany({ postId: post._id });
    await Post.findByIdAndDelete(req.params.id);

    return res.json({ message: "삭제 완료" });
  } catch (error) {
    console.error("deletePost error:", error);
    next(error);
  }
};

export const togglePostLike = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "로그인이 필요합니다." });
    }

    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ message: "게시글 없음" });
    }

    const currentUserID = req.user.userID;
    const alreadyLiked = post.likes.includes(currentUserID);

    if (alreadyLiked) {
      post.likes = post.likes.filter((userID) => userID !== currentUserID);
    } else {
      post.likes.push(currentUserID);
    }

    await post.save();

    return res.status(200).json({
      id: post._id.toString(),
      liked: !alreadyLiked,
      likes: post.likes.length,
    });
  } catch (error) {
    console.error("togglePostLike error:", error);
    next(error);
  }
};