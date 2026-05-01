import Schedule from "../schemas/calendar_db.js";
import User from "../schemas/user_db.js";
import { google } from "googleapis";
import axios from "axios";

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

const sendKakaoMessage = async (user, message) => {
  if (!user.kakaoAccessToken) {
    console.log("카카오 액세스 토큰이 없습니다.");
    return;
  }

  try {
    const response = await axios.post(
      "https://kapi.kakao.com/v2/api/talk/memo/default/send",
      {
        template_object: {
          object_type: "text",
          text: message,
          link: {
            web_url: process.env.CLIENT_URL || "http://localhost:5173",
            mobile_web_url: process.env.CLIENT_URL || "http://localhost:5173",
          },
        },
      },
      {
        headers: {
          Authorization: `Bearer ${user.kakaoAccessToken}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );
    console.log("카카오톡 메시지 전송 성공:", response.data);
  } catch (error) {
    console.error("카카오톡 메시지 전송 실패:", error.response?.data || error.message);
  }
};

export const sendScheduleNotifications = async () => {
  try {
    const now = new Date();
    const schedules = await Schedule.find({
      alarmEnabled: true,
      startDate: { $gte: now },
    });

    for (const schedule of schedules) {
      const user = await User.findOne({ userID: schedule.userId });
      if (!user) continue;

      const alarmTime = new Date(schedule.startDate.getTime() - schedule.alarm * 60000); // 분을 밀리초로 변환
      if (alarmTime <= now && alarmTime > new Date(now.getTime() - 60000)) { // 1분 내에 알림
        const message = `일정 알림: ${schedule.scheduleName}\n시작: ${schedule.startDate.toLocaleString()}`;

        // Google 메일 알림은 Google Calendar에서 처리
        if (user.googleAccessToken) {
          // 이미 Google Calendar에 설정됨
        }

        // 카카오톡 메시지 전송
        if (user.kakaoAccessToken) {
          await sendKakaoMessage(user, message);
        }
      }
    }
  } catch (error) {
    console.error("알림 전송 에러:", error);
  }
};

const buildGoogleEvent = ({ title, startDate, endDate, alarm, alarmEnabled }) => ({
  summary: title,
  start: { dateTime: new Date(startDate).toISOString() },
  end: { dateTime: new Date(endDate).toISOString() },
  reminders: {
    useDefault: false,
    overrides: alarmEnabled ? [{ method: "email", minutes: Number(alarm || 1440) }] : [],
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

    // 클라이언트 호환성을 위해 scheduleName으로 매핑
    const formattedSchedules = schedules.map(schedule => ({
      ...schedule,
      scheduleName: schedule.title,
    }));

    return res.status(200).json({
      success: true,
      total: schedules.length,
      list: formattedSchedules,
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

    // 날짜 유효성 검사
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({ success: false, message: "유효하지 않은 날짜 형식입니다." });
    }

    let googleEventId = null;

    // Google 계정이 연동되어 있으면 Google Calendar에 이벤트 생성
    if (user && user.googleAccessToken) {
      const oauth2Client = createOAuth2Client(user);
      const calendar = google.calendar({ version: "v3", auth: oauth2Client });

      const event = buildGoogleEvent({
        title: scheduleName,
        startDate: start,
        endDate: end,
        alarm: alarm ?? 1440,
        alarmEnabled: alarmEnabled !== false,
      });

      const response = await calendar.events.insert({
        calendarId: "primary",
        resource: event,
      });
      googleEventId = response.data.id;
    }

    const newSchedule = new Schedule({
      title: scheduleName,
      startDate: start,
      endDate: end,
      alarm: alarm ?? 1440,
      alarmEnabled: alarmEnabled !== false,
      googleEventId,
      userId: currentUserId,
    });

    await newSchedule.save();

    // 카카오톡 메시지 전송 (카카오 계정이 연동되어 있고 알림이 켜져 있으면)
    if (user && user.kakaoAccessToken && alarmEnabled !== false) {
      const message = `일정 알림: ${scheduleName}\n시작: ${new Date(startDate).toLocaleString()}\n종료: ${new Date(endDate).toLocaleString()}`;
      await sendKakaoMessage(user, message);
    }

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

    // 날짜 유효성 검사 (제공된 경우)
    let start = schedule.startDate;
    let end = schedule.endDate;
    if (startDate) {
      start = new Date(startDate);
      if (isNaN(start.getTime())) {
        return res.status(400).json({ success: false, message: "유효하지 않은 시작 날짜 형식입니다." });
      }
    }
    if (endDate) {
      end = new Date(endDate);
      if (isNaN(end.getTime())) {
        return res.status(400).json({ success: false, message: "유효하지 않은 종료 날짜 형식입니다." });
      }
    }

    schedule.title = scheduleName ?? schedule.title;
    schedule.startDate = start;
    schedule.endDate = end;
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