
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { DocumentProvider } from './context/DocumentContext';
import { useState } from 'react';
import HomePage from './pages/HomePage';
import AnalysisPage from './pages/AiPage';
import { RiAccountBoxFill } from "react-icons/ri";
import logoImage from '../src/assets/img/logo.svg';
import './App.css'


function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();

const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <nav className="navbar">
      <div className="nav-container">
        {/* 왼쪽: 메뉴 링크들 */}
        <div className="nav-links">
          <Link to="/" className="logo-section">
            <div className='logo-box'>
              <img src={logoImage} alt="로고" className="logo-svg" />
              <p>법닥</p>
            </div>
          </Link>
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

        {/* 오른쪽: 로그인/회원가입/마이페이지 */}
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
