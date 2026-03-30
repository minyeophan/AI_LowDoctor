import Chatbot from '../shared/Chatbot';
import Notification from '../shared/Notification';
import SearchView from '../shared/SearchView';
import './RightSidebar.css';

type SidebarType = 'chatbot' | 'notification' | 'search' | null;

interface RightSidebarProps {
  activeSidebar: SidebarType;
  onClose: () => void;
}

function RightSidebar({ activeSidebar, onClose }: RightSidebarProps) {
  if (!activeSidebar) return null;

  return (
    <aside className={`right-sidebar ${activeSidebar ? 'open' : ''}`}>
      <div className="sidebar-content">
        <div className="sidebar-header">
          <h3>
            {activeSidebar === 'chatbot' ? '챗봇' : activeSidebar === 'search' ? '사례 검색' : '일정'}
          </h3>
          <button className="close-btn" onClick={onClose}>
            ✕
          </button>
        </div>
        
        {activeSidebar === 'chatbot' 
          ? <Chatbot /> 
          : activeSidebar === 'search'
          ? <SearchView />
          : <Notification />
        }
      </div>
    </aside>
  );
}

export default RightSidebar;