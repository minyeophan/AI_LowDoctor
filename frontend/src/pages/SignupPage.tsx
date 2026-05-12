// src/pages/auth/SignupPage.tsx
import { useState } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import {
  Container,
  Box,
  TextField,
  Button,
  Typography,
  Select,
  MenuItem,
  FormControl,
  IconButton,
  InputAdornment,
  Checkbox,
  FormControlLabel,
  Link,
  FormHelperText,
} from '@mui/material';
import { Visibility, VisibilityOff, KeyboardArrowDown } from '@mui/icons-material';
import { IoClose } from 'react-icons/io5';
import { useAuth } from '../context/AuthContext';
import { colors, buttonSizes, inputSizes, borderRadius } from '../styles/theme';

// ============================
// 약관 내용
// ============================
const TERMS_CONTENT = `제1조 (목적)
본 약관은 법닥(이하 "서비스")이 제공하는 AI 기반 부동산 계약서 분석 서비스의 이용에 관한 조건 및 절차, 기타 필요한 사항을 규정함을 목적으로 합니다.

제2조 (서비스 이용)
본 서비스는 부동산 계약서 분석을 위한 AI 도구를 제공하며, 법적 조언을 대체하지 않습니다. 중요한 계약 사항은 반드시 전문가와 상담하시기 바랍니다.

제3조 (개인정보)
서비스 이용 시 수집된 개인정보는 개인정보 처리방침에 따라 처리됩니다.

제4조 (면책조항)
AI 분석 결과는 참고용이며, 법적 효력이 없습니다. 분석 결과에 따른 손해에 대해 서비스는 책임지지 않습니다.`;

const PRIVACY_CONTENT = `1. 수집하는 개인정보 항목
이름, 이메일 주소, 비밀번호, 업로드한 계약서 파일

2. 개인정보 수집 및 이용 목적
- 서비스 제공 및 계약서 분석
- 일정 관리 서비스 제공
- 커뮤니티 서비스 제공

3. 개인정보 보유 및 이용 기간
회원 탈퇴 시까지 보관하며, 탈퇴 즉시 파기합니다.

4. 개인정보 제3자 제공
수집된 개인정보는 제3자에게 제공하지 않습니다.`;

// ============================
// 약관 모달
// ============================
function AgreementModal({
  title,
  content,
  onClose,
}: {
  title: string;
  content: string;
  onClose: () => void;
}) {
  return (
    <Box
      sx={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.4)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        p: 2,
      }}
      onClick={onClose}
    >
      <Box
        sx={{
          background: '#fff',
          borderRadius: '16px',
          width: '100%',
          maxWidth: '480px',
          maxHeight: '80vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* 헤더 */}
        <Box sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          p: '16px 20px',
          borderBottom: '1px solid #f1f5f9',
        }}>
          <Typography sx={{ fontSize: '16px', fontWeight: 700, color: '#1e293b' }}>
            {title}
          </Typography>
          <IconButton onClick={onClose} size="small">
            <IoClose size={20} color="#94a3b8" />
          </IconButton>
        </Box>
        {/* 내용 */}
        <Box sx={{ p: '20px', overflowY: 'auto' }}>
          <Typography sx={{
            fontSize: '13px',
            lineHeight: 1.8,
            color: '#475569',
            whiteSpace: 'pre-line',
          }}>
            {content}
          </Typography>
        </Box>
        {/* 확인 버튼 */}
        <Box sx={{ p: '12px 20px', borderTop: '1px solid #f1f5f9' }}>
          <Button
            fullWidth
            onClick={onClose}
            sx={{
              height: '40px',
              background: colors.primary.main,
              color: '#fff',
              borderRadius: '8px',
              textTransform: 'none',
              fontWeight: 600,
              '&:hover': { background: colors.primary.hover },
            }}
          >
            확인
          </Button>
        </Box>
      </Box>
    </Box>
  );
}

// ============================
// 회원가입 페이지
// ============================
export default function SignupPage() {
  const [name, setName] = useState('');
  const [birthYear, setBirthYear] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreements, setAgreements] = useState({
    age14: false,
    terms: false,
    privacy: false,
    marketing: false,
  });
  const [errors, setErrors] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    agreements: '',
  });
  const [loading, setLoading] = useState(false);

  // ✅ 약관 모달 상태
  const [modalType, setModalType] = useState<'terms' | 'privacy' | null>(null);

  const { signup } = useAuth();
  const navigate = useNavigate();

  const validateName = (name: string) => {
    if (!name.trim()) return '이름을 입력해주세요.';
    if (name.trim().length < 2) return '이름은 2자 이상 입력해주세요.';
    return '';
  };

  const validateEmail = (email: string) => {
    if (!email.trim()) return '이메일을 입력해주세요.';
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return '올바른 이메일 형식이 아닙니다.';
    return '';
  };

  const validatePassword = (password: string) => {
    if (!password) return '비밀번호를 입력해주세요.';
    if (password.length < 8) return '비밀번호는 8자 이상이어야 합니다.';
    return '';
  };

  const validateConfirmPassword = (password: string, confirmPassword: string) => {
    if (!confirmPassword) return '비밀번호를 다시 입력해주세요.';
    if (password !== confirmPassword) return '비밀번호가 일치하지 않습니다.';
    return '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({ name: '', email: '', password: '', confirmPassword: '', agreements: '' });

    const nameError = validateName(name);
    const emailError = validateEmail(email);
    const passwordError = validatePassword(password);
    const confirmPasswordError = validateConfirmPassword(password, confirmPassword);
    let agreementsError = '';
    if (!agreements.age14 || !agreements.terms || !agreements.privacy) {
      agreementsError = '필수 약관에 모두 동의해주세요.';
    }

    if (nameError || emailError || passwordError || confirmPasswordError || agreementsError) {
      setErrors({ name: nameError, email: emailError, password: passwordError, confirmPassword: confirmPasswordError, agreements: agreementsError });
      return;
    }

    setLoading(true);
    try {
      await signup({ name: name.trim(), email, password });
      navigate('/mypage');
    } catch (err: any) {
      setErrors({ name: '', email: '이미 가입된 이메일입니다.', password: '', confirmPassword: '', agreements: '' });
    } finally {
      setLoading(false);
    }
  };

  const allAgreed = agreements.age14 && agreements.terms && agreements.privacy && agreements.marketing;

  const handleAllAgree = () => {
    const newValue = !allAgreed;
    setAgreements({ age14: newValue, terms: newValue, privacy: newValue, marketing: newValue });
    if (errors.agreements) setErrors({ ...errors, agreements: '' });
  };

  const textFieldSx = (hasError: boolean) => ({
    '& .MuiOutlinedInput-root': {
      background: '#ffffff',
      height: inputSizes.medium.height,
      fontSize: inputSizes.medium.fontSize,
      '& fieldset': { borderColor: hasError ? colors.error : colors.gray[300] },
      '&:hover fieldset': { borderColor: hasError ? colors.error : colors.gray[400] },
      '&.Mui-focused fieldset': { borderColor: hasError ? colors.error : colors.primary.main, borderWidth: '1px' },
    },
  });

  return (
    <>
      {/* ✅ 약관 모달 */}
      {modalType === 'terms' && (
        <AgreementModal
          title="이용약관"
          content={TERMS_CONTENT}
          onClose={() => setModalType(null)}
        />
      )}
      {modalType === 'privacy' && (
        <AgreementModal
          title="개인정보 수집 및 이용"
          content={PRIVACY_CONTENT}
          onClose={() => setModalType(null)}
        />
      )}

      <Box sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: colors.gray[50],
        py: 4,
      }}>
        <Container maxWidth="xs">
          <Box sx={{ borderRadius: borderRadius.lg, px: 4, py: 5 }}>
            <Typography sx={{ fontSize: '24px', fontWeight: 700, color: colors.gray[800], mb: 5, textAlign: 'center' }}>
              회원가입
            </Typography>

            <form onSubmit={handleSubmit}>
              {/* 이름 */}
              <Box sx={{ mb: 2 }}>
                <Typography sx={{ fontSize: '13px', fontWeight: 500, color: colors.gray[700], mb: 0.5 }}>이름</Typography>
                <TextField
                  fullWidth
                  placeholder="이름을 입력하세요"
                  value={name}
                  onChange={(e) => { setName(e.target.value); if (errors.name) setErrors({ ...errors, name: '' }); }}
                  disabled={loading}
                  error={!!errors.name}
                  sx={textFieldSx(!!errors.name)}
                />
                {errors.name && <FormHelperText error sx={{ ml: 0, mt: 0.5, fontSize: '12px' }}>{errors.name}</FormHelperText>}
              </Box>

              {/* 출생년도 */}
              <Box sx={{ mb: 2 }}>
                <Typography sx={{ fontSize: '13px', fontWeight: 500, color: colors.gray[700], mb: 0.5 }}>출생년도</Typography>
                <FormControl fullWidth>
                  <Select
                    value={birthYear}
                    onChange={(e) => setBirthYear(e.target.value)}
                    displayEmpty
                    disabled={loading}
                    IconComponent={KeyboardArrowDown}
                    sx={{
                      background: '#ffffff',
                      height: inputSizes.medium.height,
                      fontSize: inputSizes.medium.fontSize,
                      '& .MuiOutlinedInput-notchedOutline': { borderColor: colors.gray[300] },
                      '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: colors.gray[400] },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: colors.primary.main, borderWidth: '1px' },
                    }}
                  >
                    <MenuItem value="" disabled>
                      <Typography sx={{ fontSize: '14px', color: colors.gray[400] }}>선택하세요</Typography>
                    </MenuItem>
                    {Array.from({ length: 100 }, (_, i) => 2024 - i).map((year) => (
                      <MenuItem key={year} value={year}>{year}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>

              {/* 이메일 */}
              <Box sx={{ mb: 2 }}>
                <Typography sx={{ fontSize: '13px', fontWeight: 500, color: colors.gray[700], mb: 0.5 }}>이메일</Typography>
                <TextField
                  fullWidth
                  placeholder="example@email.com"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); if (errors.email) setErrors({ ...errors, email: '' }); }}
                  disabled={loading}
                  error={!!errors.email}
                  sx={textFieldSx(!!errors.email)}
                />
                {errors.email && <FormHelperText error sx={{ ml: 0, mt: 0.5, fontSize: '12px' }}>{errors.email}</FormHelperText>}
              </Box>

              {/* 비밀번호 */}
              <Box sx={{ mb: 2 }}>
                <Typography sx={{ fontSize: '13px', fontWeight: 500, color: colors.gray[700], mb: 0.5 }}>비밀번호</Typography>
                <TextField
                  fullWidth
                  type={showPassword ? 'text' : 'password'}
                  placeholder="8자 이상 입력하세요"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); if (errors.password) setErrors({ ...errors, password: '' }); }}
                  disabled={loading}
                  error={!!errors.password}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton onClick={() => setShowPassword(!showPassword)} edge="end" size="small" disabled={loading}>
                          {showPassword
                            ? <VisibilityOff sx={{ fontSize: '18px', color: colors.gray[400] }} />
                            : <Visibility sx={{ fontSize: '18px', color: colors.gray[400] }} />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                  sx={textFieldSx(!!errors.password)}
                />
                {errors.password && <FormHelperText error sx={{ ml: 0, mt: 0.5, fontSize: '12px' }}>{errors.password}</FormHelperText>}
              </Box>

              {/* 비밀번호 확인 */}
              <Box sx={{ mb: 3 }}>
                <Typography sx={{ fontSize: '13px', fontWeight: 500, color: colors.gray[700], mb: 0.5 }}>비밀번호 확인</Typography>
                <TextField
                  fullWidth
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="비밀번호를 다시 입력하세요"
                  value={confirmPassword}
                  onChange={(e) => { setConfirmPassword(e.target.value); if (errors.confirmPassword) setErrors({ ...errors, confirmPassword: '' }); }}
                  disabled={loading}
                  error={!!errors.confirmPassword}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton onClick={() => setShowConfirmPassword(!showConfirmPassword)} edge="end" size="small" disabled={loading}>
                          {showConfirmPassword
                            ? <VisibilityOff sx={{ fontSize: '18px', color: colors.gray[400] }} />
                            : <Visibility sx={{ fontSize: '18px', color: colors.gray[400] }} />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                  sx={textFieldSx(!!errors.confirmPassword)}
                />
                {errors.confirmPassword && <FormHelperText error sx={{ ml: 0, mt: 0.5, fontSize: '12px' }}>{errors.confirmPassword}</FormHelperText>}
              </Box>

              {/* 약관 동의 */}
              <Box sx={{
                mb: 3,
                p: 2,
                border: `1px solid ${errors.agreements ? colors.error : colors.gray[300]}`,
                borderRadius: borderRadius.md,
                background: '#ffffff',
              }}>
                {/* 전체 동의 */}
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={allAgreed}
                      onChange={handleAllAgree}
                      sx={{ color: colors.gray[400], '&.Mui-checked': { color: colors.primary.main } }}
                    />
                  }
                  label={<Typography sx={{ fontSize: '14px', fontWeight: 600, color: colors.gray[800] }}>전체동의</Typography>}
                  sx={{ mb: 1 }}
                />

                <Box sx={{ pl: 3, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                  {/* 만 14세 */}
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={agreements.age14}
                        onChange={(e) => { setAgreements({ ...agreements, age14: e.target.checked }); if (errors.agreements) setErrors({ ...errors, agreements: '' }); }}
                        size="small"
                        sx={{ color: colors.gray[400], '&.Mui-checked': { color: colors.primary.main } }}
                      />
                    }
                    label={
                      <Typography sx={{ fontSize: '13px', color: colors.gray[600] }}>
                        만 14세 이상입니다 <span style={{ color: colors.error }}>(필수)</span>
                      </Typography>
                    }
                  />

                  {/* 이용약관 */}
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={agreements.terms}
                          onChange={(e) => { setAgreements({ ...agreements, terms: e.target.checked }); if (errors.agreements) setErrors({ ...errors, agreements: '' }); }}
                          size="small"
                          sx={{ color: colors.gray[400], '&.Mui-checked': { color: colors.primary.main } }}
                        />
                      }
                      label={
                        <Typography sx={{ fontSize: '13px', color: colors.gray[600] }}>
                          이용약관 <span style={{ color: colors.error }}>(필수)</span>
                        </Typography>
                      }
                    />
                    {/* ✅ 보기 버튼 */}
                    <Typography
                      onClick={() => setModalType('terms')}
                      sx={{ fontSize: '12px', color: colors.primary.main, cursor: 'pointer', textDecoration: 'underline', flexShrink: 0, mr: 1 }}
                    >
                      보기
                    </Typography>
                  </Box>

                  {/* 개인정보 수집 및 이용 */}
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={agreements.privacy}
                          onChange={(e) => { setAgreements({ ...agreements, privacy: e.target.checked }); if (errors.agreements) setErrors({ ...errors, agreements: '' }); }}
                          size="small"
                          sx={{ color: colors.gray[400], '&.Mui-checked': { color: colors.primary.main } }}
                        />
                      }
                      label={
                        <Typography sx={{ fontSize: '13px', color: colors.gray[600] }}>
                          개인정보 수집 및 이용 <span style={{ color: colors.error }}>(필수)</span>
                        </Typography>
                      }
                    />
                    {/* ✅ 보기 버튼 */}
                    <Typography
                      onClick={() => setModalType('privacy')}
                      sx={{ fontSize: '12px', color: colors.primary.main, cursor: 'pointer', textDecoration: 'underline', flexShrink: 0, mr: 1 }}
                    >
                      보기
                    </Typography>
                  </Box>

                  {/* 마케팅 동의 */}
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={agreements.marketing}
                        onChange={(e) => setAgreements({ ...agreements, marketing: e.target.checked })}
                        size="small"
                        sx={{ color: colors.gray[400], '&.Mui-checked': { color: colors.primary.main } }}
                      />
                    }
                    label={
                      <Typography sx={{ fontSize: '13px', color: colors.gray[600] }}>
                        광고성 정보 수신 및 마케팅 활용 동의 (선택)
                      </Typography>
                    }
                  />
                </Box>
              </Box>

              {/* 약관 에러 */}
              {errors.agreements && (
                <FormHelperText error sx={{ ml: 0, mt: -2, mb: 2, fontSize: '12px' }}>{errors.agreements}</FormHelperText>
              )}

              {/* 회원가입 버튼 */}
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
                  '&:hover': { background: colors.primary.hover },
                  '&:disabled': { background: colors.gray[300], color: colors.gray[500] },
                }}
              >
                {loading ? '가입 중...' : '회원가입'}
              </Button>

              {/* 로그인 링크 */}
              <Box sx={{ textAlign: 'center' }}>
                <Typography sx={{ fontSize: '13px', color: colors.gray[600] }}>
                  이미 아이디가 있으신가요?{' '}
                  <Link component={RouterLink} to="/login" underline="none" sx={{ fontWeight: 600, color: colors.primary.main }}>
                    로그인
                  </Link>
                </Typography>
              </Box>
            </form>
          </Box>
        </Container>
      </Box>
    </>
  );
}