import express from "express";

const router = express.Router();

router.post('/', uploadComment);
router.patch('/:id', updateComment);

export default router;