import jwt from "jsonwebtoken";
import User from "../schemas/user_db.js";
import { extractBearerToken } from "../service/auth_service.js";

export const authMiddleware = async (req, res, next) => {
  try {
    const token = extractBearerToken(req.headers.authorization);

    if (!token) {
      return res.status(401).json({
        message: "인증 토큰이 없습니다.",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.sub);
    if (!user || !user.isActive) {
      return res.status(401).json({
        message: "유효하지 않은 사용자입니다.",
      });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({
      message: "유효하지 않은 토큰입니다.",
    });
  }
};

export default authMiddleware;