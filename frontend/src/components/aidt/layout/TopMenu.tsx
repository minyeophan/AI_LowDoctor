import { FaFile } from "react-icons/fa6";
import { MdFactCheck } from "react-icons/md";
import { PiWarningOctagonFill } from "react-icons/pi";
import { RiGuideFill } from "react-icons/ri";
import { RiUserCommunityFill } from "react-icons/ri";
import './TopMenu.css';

type MenuItem = 'document' | 'summary' | 'danger' | 'guide' | 'search';

interface TopMenuProps {
  selectedMenu: MenuItem;
  onMenuSelect: (menu: MenuItem) => void;
  isSidebarOpen?: boolean;
  isDisabled?: boolean; 
}

function TopMenu({ selectedMenu, onMenuSelect, isSidebarOpen }: TopMenuProps) {
  return (
    <aside className={`top-menu ${isSidebarOpen ? 'sidebar-open' : ''}`}>
      <nav className="menu-nav">
        <button
          className={`menu-item ${selectedMenu === 'document' ? 'active' : ''}`}
          onClick={() => onMenuSelect('document')}
        >
          <span className="menu-icon">
            {selectedMenu === 'document' ? (
              <FaFile size={22} color="#4099FD"/>
            ) : (
              <FaFile size={22} color="#858D99"/>
            )}
          </span>
          <span className="menu-label">본문</span>
        </button>

        <button
          className={`menu-item ${selectedMenu === 'summary' ? 'active' : ''}`}
          onClick={() => onMenuSelect('summary')}
        >
          <span className="menu-icon">
            {selectedMenu === 'summary' ? (
              <MdFactCheck size={23} color="#4099FD"/>
            ) : (
              <MdFactCheck size={23} color="#858D99"/>
            )}
          </span>
          <span className="menu-label">핵심 요약</span>
        </button>

        <button
          className={`menu-item ${selectedMenu === 'danger' ? 'active' : ''}`}
          onClick={() => onMenuSelect('danger')}
        >
          <span className="menu-icon">
            {selectedMenu === 'danger' ? (
              <PiWarningOctagonFill size={22} color="#4099FD"/>
            ) : (
              <PiWarningOctagonFill size={22} color="#858D99"/>
            )}
          </span>
          <span className="menu-label">위험 탐지</span>
        </button>

        <button
          className={`menu-item ${selectedMenu === 'guide' ? 'active' : ''}`}
          onClick={() => onMenuSelect('guide')}
        >
          <span className="menu-icon">
            {selectedMenu === 'guide' ? (
              <RiGuideFill size={20} color="#4099FD"/>
            ) : (
              <RiGuideFill size={20} color="#858D99"/>
            )}
          </span>
          <span className="menu-label">대응 가이드</span>
        </button>

        <button
          className={`menu-item ${selectedMenu === 'search' ? 'active' : ''}`}
          onClick={() => onMenuSelect('search')}
        >
          <span className="menu-icon">
            {selectedMenu === 'search' ? (
              <RiUserCommunityFill size={22} color="#4099FD"/>
            ) : (
              <RiUserCommunityFill size={22} color="#858D99"/>
            )}
          </span>
          <span className="menu-label">사례 검색</span>
        </button>
      </nav>
    </aside>
  );
}

export default TopMenu;