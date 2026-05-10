import mongoose from "mongoose";
import Upload from "../schemas/upload_db.js";
import Analysis from "../schemas/analyze_db.js";
import Result from "../schemas/result_db.js";
import Post from "../schemas/post_db.js";
import Comment from "../schemas/comment_db.js";

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

const getSortOption = (sort) => {
  if (sort === "old") return { createdAt: 1 };
  if (sort === "views") return { views: -1, createdAt: -1 };
  return { createdAt: -1 };
};

const normalizeObjectIds = (ids = []) => {
  if (!Array.isArray(ids)) return [];
  return ids.filter((id) => mongoose.Types.ObjectId.isValid(id));
};

export const getMyPageList = async (req, res, next) => {
  try {
    const { category = "draft", sort = "recent", contractType = "" } = req.query;

    if (!req.user) {
      return res.status(401).json({ message: "로그인이 필요합니다." });
    }

    const sortOption =
      sort === "name"
        ? { originalname: 1 }
        : sort === "old"
        ? { createdAt: 1 }
        : { createdAt: -1 };

    const query = { userID: req.user.userID };

    if (contractType && contractType !== "전체") {
      query.contractType = contractType;
    }

    const uploads = await Upload.find(query).sort(sortOption).lean();

    const items = await Promise.all(
      uploads.map(async (file) => {
        const analysis = await Analysis.findOne({
          documentId: file.documentId,
        }).lean();

        if (category === "draft") {
          if (file.isSaved === true) return null;

          return {
            documentId: file.documentId,
            contractType: file.contractType || "부동산",
            title: file.originalname,
            updatedAt: formatDate(file.updatedAt),
            progress: analysis?.progress || 0,
            statusText: resolveAnalysisStatus(analysis?.status),
          };
        } else {
          if (file.isSaved !== true) return null;

          return {
            documentId: file.documentId,
            contractType: file.contractType || "부동산",
            title: file.originalname,
            uploadDate: formatDate(file.createdAt),
            analysisStatus: resolveAnalysisStatus(analysis?.status),
            riskItems: analysis?.result?.riskItems || [],
          };
        }
      })
    );

    let filteredList = items.filter((item) => item !== null);

    if (contractType && contractType !== "전체") {
      filteredList = filteredList.filter(
        (item) => item.contractType === contractType
      );
    }

    return res.status(200).json({
      category: category === "draft" ? "작성 중" : "보관함",
      total: filteredList.length,
      list: filteredList,
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

    const upload = await Upload.findOne({ documentId });
    if (!upload) {
      return res.status(404).json({ message: "문서를 찾을 수 없습니다." });
    }

    await Upload.updateOne(
      { documentId },
      {
        userID: req.user.userID,
        isSaved: true,
      }
    );

    return res.status(200).json({
      message: "문서가 보관함에 저장되었습니다.",
      documentId,
      saved: true,
    });
  } catch (error) {
    console.error("문서 저장 에러:", error);
    next(error);
  }
};

export const getMyCommunityArchive = async (req, res, next) => {
  try {
    const { tab = "posts", sort = "recent" } = req.query;

    if (!req.user) {
      return res.status(401).json({ message: "로그인이 필요합니다." });
    }

    const currentUserID = req.user.userID;
    const sortOption = getSortOption(sort);

    if (tab === "posts") {
      const posts = await Post.find({ userID: currentUserID })
        .sort(sortOption)
        .lean();

      const list = await Promise.all(
        posts.map(async (post) => {
          const commentCount = await Comment.countDocuments({
            postId: post._id,
          });

          return {
            id: post._id.toString(),
            title: post.title,
            createdAt: formatDate(post.createdAt),
            views: post.views || 0,
            commentCount,
          };
        })
      );

      return res.status(200).json({
        tab: "posts",
        tabLabel: "작성글",
        total: list.length,
        list,
      });
    }

    if (tab === "comments") {
      const comments = await Comment.find({ userID: currentUserID })
        .sort(sortOption)
        .lean();

      const postIds = [
        ...new Set(
          comments
            .map((comment) => comment.postId?.toString())
            .filter(Boolean)
        ),
      ];

      const posts = await Post.find({ _id: { $in: postIds } })
        .select("title views")
        .lean();

      const postMap = new Map(
        posts.map((post) => [post._id.toString(), post])
      );

      const list = comments.map((comment) => {
        const parentPost = postMap.get(comment.postId?.toString());

        return {
          id: comment._id.toString(),
          postId: comment.postId?.toString() || "",
          title: parentPost?.title || "(삭제된 게시글)",
          content: comment.content,
          createdAt: formatDate(comment.createdAt),
          views: parentPost?.views || 0,
        };
      });

      return res.status(200).json({
        tab: "comments",
        tabLabel: "작성 댓글",
        total: list.length,
        list,
      });
    }

    if (tab === "liked") {
      const likedPosts = await Post.find({ likes: currentUserID })
        .sort(sortOption)
        .lean();

      const list = await Promise.all(
        likedPosts.map(async (post) => {
          const commentCount = await Comment.countDocuments({
            postId: post._id,
          });

          return {
            id: post._id.toString(),
            title: post.title,
            createdAt: formatDate(post.createdAt),
            views: post.views || 0,
            commentCount,
          };
        })
      );

      return res.status(200).json({
        tab: "liked",
        tabLabel: "좋아요한 글",
        total: list.length,
        list,
      });
    }

    return res.status(400).json({
      message: "지원하지 않는 탭입니다. (posts, comments, liked)",
    });
  } catch (error) {
    console.error("커뮤니티 보관함 조회 에러:", error);
    next(error);
  }
};

export const deleteMyCommunityArchive = async (req, res, next) => {
  try {
    const { tab, ids } = req.body;

    if (!req.user) {
      return res.status(401).json({ message: "로그인이 필요합니다." });
    }

    if (!tab || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        message: "tab과 ids 배열이 필요합니다.",
      });
    }

    const currentUserID = req.user.userID;
    const validIds = normalizeObjectIds(ids);

    if (validIds.length === 0) {
      return res.status(400).json({
        message: "유효한 id가 없습니다.",
      });
    }

    // 1. 작성글 삭제
    if (tab === "posts") {
      const myPosts = await Post.find({
        _id: { $in: validIds },
        userID: currentUserID,
      }).select("_id");

      const myPostIds = myPosts.map((post) => post._id);

      if (myPostIds.length === 0) {
        return res.status(404).json({
          message: "삭제할 작성글이 없습니다.",
        });
      }

      const deletedComments = await Comment.deleteMany({
        postId: { $in: myPostIds },
      });

      const deletedPosts = await Post.deleteMany({
        _id: { $in: myPostIds },
        userID: currentUserID,
      });

      return res.status(200).json({
        message: "작성글이 삭제되었습니다.",
        tab: "posts",
        deletedCount: deletedPosts.deletedCount || 0,
        deletedCommentCount: deletedComments.deletedCount || 0,
      });
    }

    // 2. 작성 댓글 삭제
    if (tab === "comments") {
      const deletedComments = await Comment.deleteMany({
        _id: { $in: validIds },
        userID: currentUserID,
      });

      return res.status(200).json({
        message: "작성 댓글이 삭제되었습니다.",
        tab: "comments",
        deletedCount: deletedComments.deletedCount || 0,
      });
    }

    // 3. 좋아요한 글 취소
    if (tab === "liked") {
      const result = await Post.updateMany(
        {
          _id: { $in: validIds },
          likes: currentUserID,
        },
        {
          $pull: { likes: currentUserID },
        }
      );

      return res.status(200).json({
        message: "좋아요가 취소되었습니다.",
        tab: "liked",
        modifiedCount: result.modifiedCount || 0,
      });
    }

    return res.status(400).json({
      message: "지원하지 않는 탭입니다. (posts, comments, liked)",
    });
  } catch (error) {
    console.error("커뮤니티 보관함 삭제 에러:", error);
    next(error);
  }
};