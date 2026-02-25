import express from "express";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import session from "express-session";
import cors from "cors";
import dotenv from "dotenv";
import swaggerUi from "swagger-ui-express";
import swaggerSpec from "./swagger/swagger.js";

import { connect } from "./schemas/index.js";

dotenv.config();

import uploadRouter from "./routes/upload_routes.js";
import analyzeRouter from "./routes/analyze_routes.js";
import resultRouter from "./routes/result_routes.js";

const app = express();
app.set('port', process.env.PORT || 3001);
connect();

app.use(morgan('dev'));

app.use(cors({
    origin: "http://localhost:5173",
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser(process.env.COOKIE_SECRET));
app.use(session({
    resave: false,
    saveUninitialized: false,
    secret: process.env.COOKIE_SECRET,
    cookie: {
        httpOnly: true,
        secure: false,
    }
}));
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use('/api', uploadRouter);
app.use('/api', analyzeRouter);
app.use('/api', resultRouter);

app.get('/', (req, res) => {
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
        error: process.env.NODE_ENV !== 'production' ? err : {}
    });
});



app.listen(app.get('port'), () => {
    console.log(app.get('port'), '번 포트에서 대기 중');
});