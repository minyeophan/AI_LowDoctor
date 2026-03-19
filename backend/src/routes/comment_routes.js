import express from "express";

const router = express.Router();

router.post('/', uploadComment);
router.patch('/:id', updateComment);
router.delete('/:id', deleteComment);

export default router;