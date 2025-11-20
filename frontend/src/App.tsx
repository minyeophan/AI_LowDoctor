
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { DocumentProvider } from './context/DocumentContext';
import { useState } from 'react';
import HomePage from './pages/HomePage';
import AnalysisPage from './pages/AiPage';
import { FaHouseChimneyCrack } from "react-icons/fa6";
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
        {/* 왼쪽: 메뉴 버튼 */}
        <button 
          className="menu-button"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="메뉴"
        >
          <span className="menu-icon">☰</span>
        </button>

        {/* 중앙: 로고  */}
        <Link to="/" className="logo-section">
          <div className='logo-box'>
            <FaHouseChimneyCrack size={18} color='#3a8bdcff'/>
            <p>법닥</p>
          </div>
         
        </Link>

        {/* 오른쪽: 메뉴 링크들 */}
        <div className="nav-links">
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

      {/* 모바일 메뉴 (햄버거 클릭 시)
      {menuOpen && (
        <div className="mobile-menu">
          <Link 
            to="/analysis" 
            className={`mobile-link ${isActive('/analysis') ? 'active' : ''}`}
            onClick={() => setMenuOpen(false)}
          >
            AIDT
          </Link>
          <Link 
            to="/community" 
            className={`mobile-link ${isActive('/community') ? 'active' : ''}`}
            onClick={() => setMenuOpen(false)}
          >
            커뮤니티
          </Link>
          <Link 
            to="/mypage" 
            className={`mobile-link ${isActive('/mypage') ? 'active' : ''}`}
            onClick={() => setMenuOpen(false)}
          >
            마이페이지
          </Link>
        </div>
      )} */}
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
