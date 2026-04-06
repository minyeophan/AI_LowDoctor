import mongoose from "mongoose";
import dotenv from "dotenv";
import Form from "./schemas/form_db.js";

dotenv.config();

const klacForms = [
    {
        form_name: "법무부 주택임대차 표준계약서(한글)",
        category: "부동산",
        source: "대한법률구조공단",
        fileUrl: "https://support.klac.or.kr/cmm/fms/FileDown_docs.do?repositoryPath=%2fECM%2f2026%2f03%2f11%2f17%2f27%2f1941cc83-a93c-4c62-9358-bcea99c42c44&filename=20260311+%eb%b2%95%eb%ac%b4%eb%b6%80+%ec%a3%bc%ed%83%9d%ec%9e%84%eb%8c%80%ec%b0%a8+%ed%91%9c%ec%a4%80%ea%b3%84%ec%95%bd%ec%84%9c(%ed%95%9c%ea%b8%80).hwp"
    },
    {
        form_name: "아파트, 맨션, 빌라 등의 임대사업용건물 임대차계약서",
        category: "부동산",
        source: "대한법률구조공단",
        fileUrl: "https://support.klac.or.kr/cmm/fms/FileDown_docs.do?repositoryPath=%2fECM%2f2018%2f07%2f16%2f10%2f14%2f57b741f2-27d2-43d7-a91b-d49dbdbc8c47&filename=%ec%95%84%ed%8c%8c%ed%8a%b8%2c+%eb%a7%a8%ec%85%98%2c+%eb%b9%8c%eb%9d%bc+%eb%93%b1%ec%9d%98+%ec%9e%84%eb%8c%80%ec%82%ac%ec%97%85%ec%9a%a9%ea%b1%b4%eb%ac%bc+%ec%9e%84%eb%8c%80%ec%b0%a8%ea%b3%84%ec%95%bd%ec%84%9c.hwp"
    },
    {
        form_name: "건물임대차계약서",
        category: "부동산",
        source: "대한법률구조공단",
        fileUrl: "https://support.klac.or.kr/cmm/fms/FileDown_docs.do?repositoryPath=%2fECM%2f2018%2f07%2f16%2f10%2f11%2fef808a69-5c85-493d-9a8d-9c8aa9c5dae2&filename=%ea%b1%b4%eb%ac%bc%ec%9e%84%eb%8c%80%ec%b0%a8%ea%b3%84%ec%95%bd%ec%84%9c.hwp"
    }
];

const seedDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URL);
        console.log("DB 연결 성공!");

        await Form.deleteMany({});

        await Form.insertMany(klacForms);
        console.log("대한법률구조공단 양식 데이터 삽입 완료!");

        mongoose.connection.close();
    } catch (error) {
        console.error("데이터 삽입 중 에러: ", error);
    }
};

seedDB();