import express from "express";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import session from "express-session";
import cors from "cors";
import dotenv from "dotenv";
import swaggerUi from "swagger-ui-express";
import swaggerSpec from "./swagger/swagger.js";

import { connect } from "./schemas/index.js";

import uploadRouter from "./routes/upload_routes.js";
import analyzeRouter from "./routes/analyze_routes.js";
import resultRouter from "./routes/result_routes.js";
import formRouter from "./routes/form_routes.js";
import authRouter from "./routes/auth_routes.js";
import convertRouter from "./routes/convert_routes.js";
import postRouter from "./routes/post_routes.js";
import commentRouter from "./routes/comment_routes.js";
import mypageRouter from "./routes/mypage_routes.js";
import chatRouter from "./routes/chat_routes.js";

dotenv.config();

const app = express();

app.set("port", process.env.PORT || 3001);
connect();

app.use(morgan("dev"));

app.use((req, res, next) => {
  res.setTimeout(120000, () => {
    res.status(408).json({ message: "요청 시간이 초과되었습니다." });
  });
  next();
});

app.use(
  cors({
    origin: ["http://localhost:5173", "http://localhost"],
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser(process.env.COOKIE_SECRET));
app.use(
  session({
    resave: false,
    saveUninitialized: false,
    secret: process.env.COOKIE_SECRET,
    cookie: {
      httpOnly: true,
      secure: false,
    },
  })
);

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use("/api/auth", authRouter);
app.use("/api", uploadRouter);
app.use("/api", analyzeRouter);
app.use("/api", resultRouter);
app.use("/api/form", formRouter);
app.use("/api", convertRouter);
app.use("/api", chatRouter);
app.use("/api/posts", postRouter);
app.use("/api", commentRouter);
app.use("/api/mypage", mypageRouter);

app.get("/", (req, res) => {
  res.json({
    msg: "AI Legal Doctor Backend OK",
  });
});

app.use((req, res, next) => {
  const error = new Error(`${req.method} ${req.url} 라우터가 없습니다.`);
  error.status = 404;
  next(error);
});

app.use((err, req, res, next) => {
  console.error(err);

  res.status(err.status || 500).json({
    message: err.message,
    error: process.env.NODE_ENV !== "production" ? err : {},
  });
});

app.listen(app.get("port"), () => {
  console.log(app.get("port"), "번 포트에서 대기 중");
});