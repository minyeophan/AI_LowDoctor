import Schedule from "../schemas/calendar_db.js";
import User from "../schemas/user_db.js";
import { google } from "googleapis";

const createOAuth2Client = (user) => {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );

  oauth2Client.setCredentials({
    access_token: user.googleAccessToken || undefined,
    refresh_token: user.googleRefreshToken || undefined,
  });

  oauth2Client.on("tokens", async (tokens) => {
    try {
      if (tokens.refresh_token) {
        user.googleRefreshToken = tokens.refresh_token;
      }
      if (tokens.access_token) {
        user.googleAccessToken = tokens.access_token;
      }
      if (tokens.expiry_date) {
        user.googleTokenExpiry = new Date(tokens.expiry_date);
      }
      await user.save();
    } catch (error) {
      console.error("Google token update error:", error);
    }
  });

  return oauth2Client;
};

const buildGoogleEvent = ({ scheduleName, startDate, endDate, alarm, alarmEnabled }) => ({
  summary: scheduleName,
  start: { dateTime: new Date(startDate).toISOString() },
  end: { dateTime: new Date(endDate).toISOString() },
  reminders: {
    useDefault: false,
    overrides: alarmEnabled ? [{ method: "email", minutes: Number(alarm || 30) }] : [],
  },
});

export const getSchedule = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "로그인이 필요합니다." });
    }

    const currentUserId = req.user.userID;

    const schedules = await Schedule.find({ userId: currentUserId })
      .sort({ startDate: 1 })
      .lean();

    return res.status(200).json({
      success: true,
      total: schedules.length,
      list: schedules,
    });
  } catch (error) {
    console.error("일정 목록 조회 에러: ", error);
    next(error);
  }
};

export const createSchedule = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "로그인이 필요합니다." });
    }

    const { scheduleName, startDate, endDate, alarm, alarmEnabled } = req.body;
    const currentUserId = req.user.userID;
    const user = await User.findById(req.user._id);

    if (!user || !user.googleAccessToken) {
      return res.status(403).json({ message: "Google 계정 연동이 필요합니다." });
    }

    const oauth2Client = createOAuth2Client(user);
    const calendar = google.calendar({ version: "v3", auth: oauth2Client });

    const event = buildGoogleEvent({
      scheduleName,
      startDate,
      endDate,
      alarm: alarm ?? 30,
      alarmEnabled: alarmEnabled !== false,
    });

    const response = await calendar.events.insert({
      calendarId: "primary",
      resource: event,
    });

    const newSchedule = new Schedule({
      scheduleName,
      startDate,
      endDate,
      alarm: alarm ?? 30,
      alarmEnabled: alarmEnabled !== false,
      googleEventId: response.data.id,
      userId: currentUserId,
    });

    await newSchedule.save();

    return res.status(201).json({
      success: true,
      message: "일정이 생성되었습니다.",
      data: newSchedule,
    });
  } catch (error) {
    console.error("일정 생성 에러: ", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const updateSchedule = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "로그인이 필요합니다." });
    }

    const { id } = req.params;
    const currentUserId = req.user.userID;
    const { scheduleName, startDate, endDate, alarm, alarmEnabled } = req.body;

    const schedule = await Schedule.findOne({ _id: id, userId: currentUserId });
    if (!schedule) {
      return res.status(404).json({ success: false, message: "일정을 찾을 수 없습니다." });
    }

    schedule.scheduleName = scheduleName ?? schedule.scheduleName;
    schedule.startDate = startDate ? new Date(startDate) : schedule.startDate;
    schedule.endDate = endDate ? new Date(endDate) : schedule.endDate;
    schedule.alarm = alarm ?? schedule.alarm;
    schedule.alarmEnabled = alarmEnabled !== undefined ? alarmEnabled : schedule.alarmEnabled;

    const user = await User.findById(req.user._id);
    if (schedule.googleEventId && user && user.googleAccessToken) {
      const oauth2Client = createOAuth2Client(user);
      const calendar = google.calendar({ version: "v3", auth: oauth2Client });
      await calendar.events.update({
        calendarId: "primary",
        eventId: schedule.googleEventId,
        resource: buildGoogleEvent(schedule),
      });
    }

    await schedule.save();

    return res.status(200).json({ success: true, data: schedule });
  } catch (error) {
    console.error("일정 수정 에러: ", error);
    return res.status(500).json({ success: false, message: "수정 실패" });
  }
};

export const deleteSchedule = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "로그인이 필요합니다." });
    }

    const { id } = req.params;
    const currentUserId = req.user.userID;
    const schedule = await Schedule.findOne({ _id: id, userId: currentUserId });

    if (!schedule) {
      return res.status(404).json({ success: false, message: "일정을 찾을 수 없거나 삭제 권한이 없습니다." });
    }

    const user = await User.findById(req.user._id);
    if (schedule.googleEventId && user && user.googleAccessToken) {
      try {
        const oauth2Client = createOAuth2Client(user);
        const calendar = google.calendar({ version: "v3", auth: oauth2Client });
        await calendar.events.delete({
          calendarId: "primary",
          eventId: schedule.googleEventId,
        });
      } catch (error) {
        console.error("Google 이벤트 삭제 실패:", error);
      }
    }

    await schedule.deleteOne();

    return res.status(200).json({ success: true, message: "삭제 완료" });
  } catch (error) {
    console.error("일정 삭제 에러: ", error);
    return res.status(500).json({ success: false, message: "삭제 실패" });
  }
};