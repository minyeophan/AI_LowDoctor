import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const { MONGO_URL, NODE_ENV } = process.env;

export const connect = async () => {
    try {
        if (NODE_ENV !== 'production') {
            mongoose.set('debug', true);
        }
        
        await mongoose.connect(MONGO_URL);
        console.log("몽고디비 연결 성공");
    } catch (error) {
        console.error("몽고디비 연결 에러", error);
        process.exit(1);
    }
};