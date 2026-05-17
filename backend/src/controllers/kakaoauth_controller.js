import passport from "passport";
import { Strategy as KakaoStrategy } from "passport-kakao";
import User from "../schemas/user_db.js";
import { randomUUID } from "crypto";
import { signAccessToken } from "../service/auth_service.js";

passport.use(
  new KakaoStrategy(
    {
      clientID: process.env.KAKAO_CLIENT_ID,
      clientSecret: process.env.KAKAO_CLIENT_SECRET,
      callbackURL: process.env.KAKAO_REDIRECT_URI,
      passReqToCallback: true,
    },
    async (req, accessToken, refreshToken, profile, done) => {
      try {
        const email = profile._json?.kakao_account?.email;
        let user = await User.findOne({ providerId: profile.id });

        if (!user && email) {
          user = await User.findOne({ email });
        }

        if (!user) {
          // 연동 모드: 로그인된 사용자의 토큰 업데이트
          if (req.user) {
            req.user.kakaoAccessToken = accessToken;
            if (refreshToken) {
              req.user.kakaoRefreshToken = refreshToken;
            }
            req.user.kakaoTokenExpiry = new Date(Date.now() + 3600000);
            await req.user.save();
            return done(null, req.user);
          } else {
            // 새 사용자 생성 (로그인 모드)
            user = await User.create({
              userID: `user_${randomUUID()}`,
              name: profile.displayName || profile.username || "Kakao User",
              email,
              password: undefined,
              provider: "kakao",
              providerId: profile.id,
              kakaoAccessToken: accessToken,
              kakaoRefreshToken: refreshToken || null,
              kakaoTokenExpiry: refreshToken ? new Date(Date.now() + 3600000) : null,
            });
          }
        } else {
          // 기존 사용자 업데이트
          user.kakaoAccessToken = accessToken;
          if (refreshToken) {
            user.kakaoRefreshToken = refreshToken;
          }
          user.kakaoTokenExpiry = new Date(Date.now() + 3600000);
          await user.save();
        }

        return done(null, user);
      } catch (error) {
        return done(error, null);
      }
    }
  )
);

export const kakaoAuth = async (req, res, next) => {
  // link 모드일 때는 JWT 토큰 확인
  if (req.query.link === 'true') {
    const authMiddleware = (await import("../middleware/auth_middle.js")).authMiddleware;
    authMiddleware(req, res, (err) => {
      if (err || !req.user) {
        return res.status(401).json({ message: "연동을 위해 로그인이 필요합니다." });
      }
      // JWT 확인 후 passport 인증 진행
      passport.authenticate("kakao", {
        scope: ["profile_nickname", "account_email", "talk_message"],
      })(req, res, next);
    });
  } else {
    // 일반 로그인 모드
    passport.authenticate("kakao", {
      scope: ["profile_nickname", "account_email", "talk_message"],
    })(req, res, next);
  }
};

export const kakaoAuthCallback = passport.authenticate("kakao", {
  failureRedirect: "/api/auth/login",
  session: false,
});

export const kakaoAuthSuccess = (req, res) => {
  if (!req.user) {
    return res.redirect("/api/auth/login");
  }

  const isLinkMode = req.query.link === 'true';
  const isApiRequest = req.headers['user-agent'] && req.headers['user-agent'].includes('Swagger') ||
                       req.query.response_type === 'json';

  if (isLinkMode) {
    // 연동 모드: 토큰만 저장하고 성공 메시지 반환
    if (isApiRequest) {
      return res.json({
        success: true,
        message: "카카오 계정 연동 성공",
        user: {
          id: req.user._id,
          email: req.user.email,
          name: req.user.name
        }
      });
    } else {
      const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";
      return res.redirect(`${clientUrl}/auth/link/kakao/success`);
    }
  } else {
    // 로그인 모드: JWT 토큰 반환
    const token = signAccessToken(req.user);
    if (isApiRequest) {
      return res.json({
        success: true,
        message: "카카오 로그인 성공",
        token: token,
        user: {
          id: req.user._id,
          email: req.user.email,
          name: req.user.name
        }
      });
    } else {
      const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";
      return res.redirect(`${clientUrl}/auth/kakao/success?token=${token}`);
    }
  }
};