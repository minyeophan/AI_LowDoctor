import express from "express";

const router = express.Router();

router.post('/', uploadComment);

export default router;