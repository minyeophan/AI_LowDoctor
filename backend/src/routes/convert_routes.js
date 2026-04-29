import express from 'express';
import { convertDocument } from '../controllers/convert_controller.js';

const router = express.Router();

router.post('/convert', (req, res, next) => {
    req.setTimeout(90000, () => {
        res.status(408).json({ message: '변환 시간이 초과되었습니다.' });
    });
    next();
}, convertDocument);

export default router;
