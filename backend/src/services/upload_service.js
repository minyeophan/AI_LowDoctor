// src/services/upload_service.js
import fs from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid";

const UPLOAD_DIR = process.env.UPLOAD_DIR || "./uploads";

export const saveFileInfo = (file) => {

  const documentID = uuidv4();

  return {
    document_id: documentID,
    status: uploaded,
  };
};

export const getUploadedFiles = () => {
  const files = fs.readdirSync(UPLOAD_DIR);
  return { count: files.length, files };
};
