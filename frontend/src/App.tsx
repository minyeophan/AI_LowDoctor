import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { DocumentProvider } from './context/DocumentContext';
import { useState } from 'react';
import HomePage from './pages/HomePage';
import AnalysisPage from './pages/AiPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import CommunityPage from './pages/CommunityPage';
import PostDetailPage from './pages/PostdetailPage';
import WritePostPage from './pages/WritepostPage';
import SchedulePage from './pages/SchedulePage';
import FormPage from './pages/FormPage';
import MyPage from './pages/MyPage';
import GoogleAuthSuccess from './pages/GoogleAuthSuccess';
import KakaoAuthSuccess from './pages/KakaoAuthSuccess';
import KakaoLinkSuccess from './pages/KakaoLinkSuccess';
import PrivateRoute from './components/common/PrivateRoute';
import { AuthProvider, useAuth } from './context/AuthContext';
import { MdAccountCircle } from "react-icons/md";
import logoImage from '../src/assets/img/logo.svg';
import { HiMenu, HiX } from "react-icons/hi";

import './App.css'

function Navbar() {
  const location = useLocation();
  const { isAuthenticated, user } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const isActive = (path: string) => {
    if (path === '/community') {
      return location.pathname === '/community' ||
        location.pathname.startsWith('/community/');
    }
    return location.pathname === path;
  };

  const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);
  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  return (
    <nav className="navbar">
      <div className="nav-container">
        {/* 왼쪽 영역 */}
        <div className="nav-left">
          <Link to="/" className="logo-section" onClick={closeMobileMenu}>
            <div className='logo-box'>
              <img src={logoImage} alt="로고" className="logo-svg" />
              <p>법닥</p>
            </div>
          </Link>

          {/* 데스크탑 메뉴 */}
          <div className="nav-links-desktop">
            <Link to="/analysis" className={`nav-link ${isActive('/analysis') ? 'active' : ''}`}>
              AIDT
            </Link>
            <Link to="/schedule" className={`nav-link ${isActive('/schedule') ? 'active' : ''}`}>
              일정관리
            </Link>
            <Link to="/form" className={`nav-link ${isActive('/form') ? 'active' : ''}`}>
              법률서식
            </Link>
            <Link to="/community" className={`nav-link ${isActive('/community') ? 'active' : ''}`}>
              커뮤니티
            </Link>
          </div>
        </div>

        {/* 햄버거 버튼 (모바일) */}
        <button
          className="mobile-menu-toggle"
          onClick={toggleMobileMenu}
          aria-label="메뉴"
        >
          {isMobileMenuOpen ? <HiX size={28} /> : <HiMenu size={28} />}
        </button>

        {/* 모바일 메뉴 */}
        <div className={`nav-links-mobile ${isMobileMenuOpen ? 'mobile-open' : ''}`}>
          <Link to="/analysis" className={`nav-link ${isActive('/analysis') ? 'active' : ''}`} onClick={closeMobileMenu}>
            AIDT
          </Link>
          <Link to="/schedule" className={`nav-link ${isActive('/schedule') ? 'active' : ''}`} onClick={closeMobileMenu}>
            일정관리
          </Link>
          <Link to="/form" className={`nav-link ${isActive('/form') ? 'active' : ''}`} onClick={closeMobileMenu}>
            법률서식
          </Link>
          <Link to="/community" className={`nav-link ${isActive('/community') ? 'active' : ''}`} onClick={closeMobileMenu}>
            커뮤니티
          </Link>

          {/* 모바일 인증 링크 */}
          <div className="nav-auth-mobile">
            {isAuthenticated ? (
              <Link to="/mypage" className="auth-link" onClick={closeMobileMenu}>
                마이페이지
              </Link>
            ) : (
              <>
                <Link to="/login" className="auth-link" onClick={closeMobileMenu}>
                  로그인
                </Link>
                <Link to="/signup" className="auth-link signup-btn" onClick={closeMobileMenu}>
                  회원가입
                </Link>
              </>
            )}
          </div>
        </div>

        {/* 오른쪽 영역 */}
        <div className="nav-auth">
          {isAuthenticated ? (
            <Link to="/mypage" className="mypage-icon" aria-label="마이페이지">
              {user?.avatar
                ? <img src={user.avatar} alt="프로필" className="user-avatar-img" />
                : <MdAccountCircle className="user-icon" size={24} />
              }
            </Link>
          ) : (
            <>
              <Link to="/login" className="auth-link">로그인</Link>
              <Link to="/signup" className="auth-link signup-btn">회원가입</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

function AppContent() {
  const location = useLocation();

  const hideNavbarPaths = ['/login', '/signup', '/find-id', '/reset-password', '/analysis', '/community/write', '/auth/google/success', '/auth/kakao/success', '/auth/link/kakao/success']; 
  const shouldHideNavbar = hideNavbarPaths.includes(location.pathname);

  return (
    <div className="app">
      {!shouldHideNavbar && <Navbar />}
      <main>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path='/analysis' element={<PrivateRoute><AnalysisPage /></PrivateRoute>} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/mypage/*" element={<PrivateRoute><MyPage /></PrivateRoute>}/>
          <Route path="/community" element={<CommunityPage />} />
          <Route path="/community/:id" element={<PrivateRoute><PostDetailPage /></PrivateRoute>} />
          <Route path="/community/write" element={<PrivateRoute><WritePostPage /></PrivateRoute>}/>
          <Route path="/schedule" element={<PrivateRoute><SchedulePage /></PrivateRoute>}  />
          <Route path="/form" element={<PrivateRoute><FormPage /></PrivateRoute>} />
          <Route path="/auth/google/success" element={<GoogleAuthSuccess />} />
          <Route path="/auth/kakao/success" element={<KakaoAuthSuccess />} />
          <Route path="/auth/link/kakao/success" element={<KakaoLinkSuccess />} />
          {/* 나중에 추가할 페이지들 */}
          {/* <Route path="/find-id" element={<FindIdPage />} /> */}
          {/* <Route path="/reset-password" element={<ResetPasswordPage />} /> */}
        </Routes>
      </main>
    </div>
  );
}

function App() {
  return (
    <DocumentProvider>
      <BrowserRouter>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </BrowserRouter>
    </DocumentProvider>
  );
}

export default App;