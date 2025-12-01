
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { DocumentProvider } from './context/DocumentContext';
import { useState } from 'react';
import HomePage from './pages/HomePage';
import AnalysisPage from './pages/AiPage';
import { RiAccountBoxFill } from "react-icons/ri";
import logoImage from '../src/assets/img/logo.svg';
import { HiMenu, HiX } from "react-icons/hi";
import './App.css'


function Navbar() {
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

const isActive = (path: string) => {
    return location.pathname === path;
  };

   const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <nav className="navbar">
  <div className="nav-container">
    {/* ===== 왼쪽 영역 ===== */}
    <div className="nav-left">
      {/* 로고 */}
      <Link to="/" className="logo-section" onClick={closeMobileMenu}>
        <div className='logo-box'>
          <img src={logoImage} alt="로고" className="logo-svg" />
          <p>법닥</p>
        </div>
      </Link>

      {/* 데스크톱 메뉴 */}
      <div className="nav-links-desktop">
        <Link 
          to="/analysis" 
          className={`nav-link ${isActive('/analysis') ? 'active' : ''}`}
        >
          AIDT
        </Link>
        <Link 
          to="/schedule" 
          className={`nav-link ${isActive('/schedule') ? 'active' : ''}`}
        >
          일정관리
        </Link>
        <Link 
          to="/community" 
          className={`nav-link ${isActive('/community') ? 'active' : ''}`}
        >
          커뮤니티
        </Link>
      </div>
    </div>
    {/* ===== nav-left 끝 ===== */}

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
      <Link 
        to="/analysis" 
        className={`nav-link ${isActive('/analysis') ? 'active' : ''}`}
        onClick={closeMobileMenu}
      >
        AIDT
      </Link>
      <Link 
        to="/schedule" 
        className={`nav-link ${isActive('/schedule') ? 'active' : ''}`}
        onClick={closeMobileMenu}
      >
        일정관리
      </Link>
      <Link 
        to="/community" 
        className={`nav-link ${isActive('/community') ? 'active' : ''}`}
        onClick={closeMobileMenu}
      >
        커뮤니티
      </Link>

      {/* 모바일 인증 링크 */}
      <div className="nav-auth-mobile">
        <Link to="/login" className="auth-link" onClick={closeMobileMenu}>
          로그인
        </Link>
        <Link to="/signup" className="auth-link signup-btn" onClick={closeMobileMenu}>
          회원가입
        </Link>
        <Link to="/mypage" className="auth-link" onClick={closeMobileMenu}>
          마이페이지
        </Link>
      </div>
    </div>

    {/* ===== 오른쪽 영역 ===== */}
    <div className="nav-auth">
      <Link to="/login" className="auth-link">
        로그인
      </Link>
      <Link to="/signup" className="auth-link signup-btn">
        회원가입
      </Link>
      <Link to="/mypage" className="mypage-icon" aria-label="마이페이지">
        <RiAccountBoxFill className="user-icon" size={24}/>
      </Link>
    </div>
  </div>
</nav>
  );
}

function App() {
  return (
  <DocumentProvider>
      <BrowserRouter>
        <div className="app">
          <Navbar/>

          {/* 페이지 내용이 여기에 보임 */}
          <main>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path='/analysis' element={<AnalysisPage/>}></Route>
            </Routes>
          </main>
        </div>
      </BrowserRouter>
   </DocumentProvider>
  )
}

export default App
