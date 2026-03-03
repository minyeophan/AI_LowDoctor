import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { User } from "../schemas";

export const createToken = async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ code: 401, message: "존재하지 않는 사용자입니다." });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ code: 401, message: "비밀번호가 틀렸습니다." });
        }

        const token = jwt.sign(
            { userID: user.id, name: user.name },
            process.env.JWT_SECRET,
            { expiresIn: "30m", issuer: "AI_LawDoctor" }
        );

        return res.json({ code: 200, message: "토큰이 발급되었습니다.", token });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ code: 500, message: "서버 에러" });
    }
};