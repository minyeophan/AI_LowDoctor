// src/components/common/PrivateRoute.tsx
import { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Toast from './Toast';

interface PrivateRouteProps {
  children: React.ReactNode;
}

export default function PrivateRoute({ children }: PrivateRouteProps) {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();
  const [showToast, setShowToast] = useState(false);
  const [redirect, setRedirect] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      // 토스트 표시
      setShowToast(true);
      const timer = setTimeout(() => {
        setRedirect(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [isLoading, isAuthenticated]);

  // 로그인 상태 확인 중
  if (isLoading) {
    return <></>;
  }

  // 토스트 표시 후 redirect
  if (!isAuthenticated) {
    if (redirect) {
      return (
        <Navigate
          to="/login"
          state={{ from: location.pathname }}
          replace
        />
      );
    }

    return (
      <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
        <Toast
          visible={showToast}
          message="로그인 후 이용해주세요."
          type="warning"
          onClose={() => setShowToast(false)}
        />
      </div>
    );
  }

  return <>{children}</>;
}