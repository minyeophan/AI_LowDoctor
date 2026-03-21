// src/pages/auth/LoginPage.tsx
import LogoImg from '../assets/img/logo.svg';
import { useState } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import {
  Container,
  Box,
  TextField,
  Button,
  Typography,
  Checkbox,
  FormControlLabel,
  Link,
  IconButton,
  InputAdornment,
  FormHelperText,
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { colors, buttonSizes, inputSizes, borderRadius } from '../styles/theme';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [errors, setErrors] = useState({
    email: '',
    password: '',
  });
  const [toast, setToast] = useState(false);
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const validateEmail = (email: string) => {
    if (!email.trim()) {
      return '이메일을 입력해주세요.';
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return '올바른 이메일 형식이 아닙니다.';
    }
    return '';
  };

  const validatePassword = (password: string) => {
    if (!password) {
      return '비밀번호를 입력해주세요.';
    }
    return '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setErrors({ email: '', password: '' });

    const emailError = validateEmail(email);
    const passwordError = validatePassword(password);

    if (emailError || passwordError) {
      setErrors({
        email: emailError,
        password: passwordError,
      });
      return;
    }

    setLoading(true);

    try {
      await login({ email, password });
      navigate('/mypage');
    } catch (err) {
      setErrors({ email: '', password: '' });
      setToast(true);
      setTimeout(() => setToast(false), 3000);
    } finally {
      setLoading(false);
    }
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    if (errors.email) {
      setErrors({ ...errors, email: '' });
    }
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
    if (errors.password) {
      setErrors({ ...errors, password: '' });
    }
  };

  return (
    <>
      {/* 상단 토스트 팝업 */}
      {toast && (
        <Box
          sx={{
            position: 'fixed',
            top: 24,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 9999,
            background: '#1e293b',
            color: '#fff',
            px: 3,
            py: 1.5,
            borderRadius: '8px',
            fontSize: '14px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            whiteSpace: 'nowrap',
          }}
        >
          로그인에 실패했습니다. 이메일과 비밀번호를 확인해주세요.
        </Box>
      )}

      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: colors.gray[50],
          fontFamily: "'KoPub', sans-serif",
          pb: 12,
        }}
      >
        <Container maxWidth="xs">
          <Box
            sx={{
              borderRadius: borderRadius.lg,
              px: 4,
              py: 5,
            }}
          >
            {/* 로고 (클릭 시 홈으로) */}
            <Box
              component={RouterLink}
              to="/"
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mb: 6,
                textDecoration: 'none',
                cursor: 'pointer',
                gap: 0.8,
              }}
            >
              <img src={LogoImg} width={24} height={24} />
              <Typography
                sx={{
                  fontSize: '24px',
                  fontWeight: 700,
                  color: colors.gray[800],
                }}
              >
                법닥
              </Typography>
            </Box>

            {/* 로그인 폼 */}
            <form onSubmit={handleSubmit}>
              {/* 이메일 */}
              <Box sx={{ mb: 2 }}>
                <Typography
                  sx={{
                    fontSize: '13px',
                    fontWeight: 500,
                    color: colors.gray[700],
                    mb: 1,
                  }}
                >
                  아이디
                </Typography>
                <TextField
                  fullWidth
                  placeholder="이메일을 입력하세요"
                  value={email}
                  onChange={handleEmailChange}
                  disabled={loading}
                  error={!!errors.email}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      background: '#ffffff',
                      height: inputSizes.medium.height,
                      fontSize: inputSizes.medium.fontSize,
                      fontFamily: "'KoPub', sans-serif",
                      '& fieldset': {
                        borderColor: errors.email ? colors.error : colors.gray[300],
                      },
                      '&:hover fieldset': {
                        borderColor: errors.email ? colors.error : colors.gray[400],
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: errors.email ? colors.error : colors.primary.main,
                        borderWidth: '1px',
                      },
                    },
                  }}
                />
                {errors.email && (
                  <FormHelperText error sx={{ ml: 0, mt: 0.5, fontSize: '12px' }}>
                    {errors.email}
                  </FormHelperText>
                )}
              </Box>

              {/* 비밀번호 */}
              <Box sx={{ mb: 1 }}>
                <Typography
                  sx={{
                    fontSize: '13px',
                    fontWeight: 500,
                    color: colors.gray[700],
                    mb: 1,
                  }}
                >
                  비밀번호
                </Typography>
                <TextField
                  fullWidth
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••"
                  value={password}
                  onChange={handlePasswordChange}
                  disabled={loading}
                  error={!!errors.password}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowPassword(!showPassword)}
                          edge="end"
                          size="small"
                          disabled={loading}
                        >
                          {showPassword ? (
                            <VisibilityOff sx={{ fontSize: '18px', color: colors.gray[400] }} />
                          ) : (
                            <Visibility sx={{ fontSize: '18px', color: colors.gray[400] }} />
                          )}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      background: '#ffffff',
                      height: inputSizes.medium.height,
                      fontSize: inputSizes.medium.fontSize,
                      '& fieldset': {
                        borderColor: errors.password ? colors.error : colors.gray[300],
                      },
                      '&:hover fieldset': {
                        borderColor: errors.password ? colors.error : colors.gray[400],
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: errors.password ? colors.error : colors.primary.main,
                        borderWidth: '1px',
                      },
                    },
                  }}
                />
                {errors.password && (
                  <FormHelperText error sx={{ ml: 0, mt: 0.5, fontSize: '12px' }}>
                    {errors.password}
                  </FormHelperText>
                )}
              </Box>

              {/* 아이디 저장 체크박스 */}
              <Box sx={{ mb: 1,borderRadius: '4px' }}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      size="small"
                      sx={{
                        color: colors.gray[400],
                        '&.Mui-checked': {
                          color: colors.primary.main,
                        },
                      }}
                    />
                  }
                  label={
                    <Typography sx={{ fontSize: '13px', color: colors.gray[600] }}>
                      아이디 저장
                    </Typography>
                  }
                />
              </Box>

              {/* 로그인 버튼 */}
              <Button
                fullWidth
                type="submit"
                disabled={loading}
                sx={{
                  height: buttonSizes.medium.height,
                  fontSize: buttonSizes.medium.fontSize,
                  fontWeight: 600,
                  background: colors.primary.main,
                  color: 'white',
                  borderRadius: borderRadius.md,
                  textTransform: 'none',
                  mb: 2,
                  '&:hover': {
                    background: colors.primary.hover,
                  },
                  '&:disabled': {
                    background: colors.gray[300],
                    color: colors.gray[500],
                  },
                }}
              >
                {loading ? '로그인 중...' : '로그인'}
              </Button>

              {/* 하단 링크 */}
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'center',
                  gap: 2,
                }}
              >
                <Link
                  href="#"
                  underline="none"
                  sx={{
                    fontSize: '13px',
                    color: colors.gray[600],
                    '&:hover': {
                      color: colors.gray[800],
                    },
                  }}
                >
                  아이디 찾기
                </Link>
                <Box sx={{ color: colors.gray[300] }}>|</Box>
                <Link
                  href="#"
                  underline="none"
                  sx={{
                    fontSize: '13px',
                    color: colors.gray[600],
                    '&:hover': {
                      color: colors.gray[800],
                    },
                  }}
                >
                  비밀번호 재설정
                </Link>
                <Box sx={{ color: colors.gray[300] }}>|</Box>
                <Link
                  component={RouterLink}
                  to="/signup"
                  underline="none"
                  sx={{
                    fontSize: '13px',
                    color: colors.gray[600],
                    '&:hover': {
                      color: colors.gray[800],
                    },
                  }}
                >
                  회원가입
                </Link>
              </Box>
            </form>
          </Box>
        </Container>
      </Box>
    </>
  );
}