import { execFile } from "child_process";
import path from "path";

/**
 * Python analyzer를 실행하여 결과(JSON)를 가져옴
 */
export const analyzeWithPython = (filePath, mimetype) => {
  return new Promise((resolve, reject) => {
    const scriptPath = path.join("AI", "analyzer.py");

    console.log(`Python analyzer 실행: ${scriptPath}`);

    execFile(
      "python",
      [scriptPath, filePath, mimetype],
      { maxBuffer: 10 * 1024 * 1024 },
      (error, stdout, stderr) => {
        if (error) {
          console.error("Python 오류:", stderr);
          return reject(error);
        }

        console.log("Python 출력:", stdout);
        console.log("Python stdout raw:", stdout);

        try {
          const parsed = JSON.parse(stdout); // JSON 파싱
          resolve(parsed);
        } catch (err) {
          reject(new Error("Python 출력 JSON 파싱 실패"));
        }
      }
    );
  });
};

// 기존 extractText 함수는 사용 안함
export const extractText = async () => {
  return "";
};

// 기존 analyzeWithExtractedText 함수도 사용 안함
export const analyzeWithExtractedText = async () => {
  return {};
};
