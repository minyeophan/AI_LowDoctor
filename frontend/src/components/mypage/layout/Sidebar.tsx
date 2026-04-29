// src/components/mypage/layout/Sidebar.tsx
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import '../../mypage/layout/Sidebar.css';
import { RiHome2Fill } from "react-icons/ri";
import { IoDocumentTextSharp } from "react-icons/io5";
import { BsPeopleFill } from "react-icons/bs";
import { IoMdSettings } from "react-icons/io";
import { IoLogOut } from "react-icons/io5";
import { MdAccountCircle } from "react-icons/md";

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path: string) => {
    if (path === '/mypage' && location.pathname === '/mypage') {
      return true;
    }
    if (path === '/mypage') {
      return location.pathname === '/mypage';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <aside className="sidebar">
      {/* 프로필 영역 */}
      <div className="profile-section">
        <div className="profile-info">
          <div className="profile-avatar">
            {user?.avatar ? (
              <img src={user.avatar} alt="프로필" className="profile-avatar-img" />
            ) : (
              <MdAccountCircle size={55} color="#d0d0d0" />
            )}
          </div>
          <div className="profile-text">
            <h3 className="profile-name">{user?.name || '가나다님'}</h3>
            <p className="profile-email">{user?.email || 'abc1234@naver.com'}</p>
          </div>
        </div>
        <button 
          className="btn-edit-profile"
          onClick={() => navigate('/mypage/settings')}
        >
          프로필 수정
        </button>
      </div>

      <div className="divider" />

      {/* 메뉴 */}
      <nav className="sidebar-nav">
        <Link
          to="/mypage"
          className={`nav-item ${isActive('/mypage') && location.pathname === '/mypage' ? 'active' : ''}`}
        >
          <span className="nav-icon"><RiHome2Fill /></span>
          <span className="nav-label">홈</span>
        </Link>

        <Link
          to="/mypage/documents"
          className={`nav-item ${isActive('/mypage/documents') ? 'active' : ''}`}
        >
          <span className="nav-icon"><IoDocumentTextSharp /></span>
          <span className="nav-label">내 계약서</span>
        </Link>

        <Link
          to="/mypage/community"
          className={`nav-item ${isActive('/mypage/community') ? 'active' : ''}`}
        >
          <span className="nav-icon"><BsPeopleFill /></span>
          <span className="nav-label">커뮤니티 활동</span>
        </Link>

        <Link
          to="/mypage/settings"
          className={`nav-item ${isActive('/mypage/settings') ? 'active' : ''}`}
        >
          <span className="nav-icon"><IoMdSettings /></span>
          <span className="nav-label">설정</span>
        </Link>
      </nav>

      {/* 로그아웃 */}
      <button className="btn-logout" onClick={handleLogout}>
        <span className="nav-icon"><IoLogOut /></span>
        <span>로그아웃</span>
      </button>
    </aside>
  );
}