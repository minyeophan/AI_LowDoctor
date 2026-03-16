import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import User from "../schemas/user_db.js";

export const signup = async (req, res) => {
    const { userID, name, email, password, role } = req.body;
    try {
        const exUser = await User.findOne({ email });
        if (exUser) {
            return res.status(409).json({ code: 409, message: "이미 존재하는 이메일 입니다." });
        }
        const hash = await bcrypt.hash(password, 12);
        await User.create({ userID, name, email, password: hash, role });
        return res.status(201).json({ code: 201, message: "회원가입이 완료되었습니다." });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ code: 500, message: "서버 에러" });
    }
};

export const createToken = async (req, res) => {
    const { userID, password } = req.body;
    try {
        const user = await User.findOne({ userID });
        if (!user) {
            return res.status(401).json({ code: 401, message: "존재하지 않는 사용자입니다." });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ code: 401, message: "비밀번호가 틀렸습니다." });
        }

        const login = jwt.sign(
            { userID: user._id, name: user.name },
            process.env.JWT_SECRET,
            { expiresIn: "30m", issuer: "AI_LawDoctor" }
        );

        return res.json({ code: 200, message: "토큰이 발급되었습니다.", login });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ code: 500, message: "서버 에러" });
    }
};

export const tokenTest = (req, res) => {
    return res.json({
        code: 200,
        message: '토큰 인증 성공',
        user: res.locals.decoded,
    });
};