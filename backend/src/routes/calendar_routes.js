import express from "express";
import authMiddleware from "../middleware/auth_middle.js";
import * as CalendarCtrl from "../controllers/calendar_controller.js";

const router = express.Router();

router.use(authMiddleware);

router.post("/", CalendarCtrl.createSchedule);
router.get("/", CalendarCtrl.getSchedule);
router.patch("/:id", CalendarCtrl.updateSchedule);
router.delete("/:id", CalendarCtrl.deleteSchedule);

export default router;