// src/pages/KakaoLinkSuccess.tsx
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function KakaoLinkSuccess() {
  const navigate = useNavigate();

  useEffect(() => {
    // 연동 완료 후 설정 페이지로 이동
    navigate('/mypage/settings', { replace: true });
  }, []);

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      fontSize: '14px',
      color: '#666',
    }}>
      카카오 연동 처리 중...
    </div>
  );
}