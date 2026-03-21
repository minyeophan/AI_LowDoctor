import jwt from "jsonwebtoken";

export const serializeUser = (user) => ({
  id: user._id.toString(),
  name: user.name,
  email: user.email || "",
  avatar: user.avatar || "",
});

export const signAccessToken = (user) => {
  return jwt.sign(
    {
      sub: user._id.toString(),
      email: user.email || "",
      provider: user.provider,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRES_IN || "7d",
    }
  );
};

export const extractBearerToken = (authHeader = "") => {
  if (!authHeader.startsWith("Bearer ")) return null;
  return authHeader.split(" ")[1];
};