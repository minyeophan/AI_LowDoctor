import Chatbot from '../shared/Chatbot';
import Notification from '../shared/Notification';
import './RightSidebar.css';

type SidebarType = 'chatbot' | 'notification' | null;

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
            {activeSidebar === 'chatbot' ? '💬 챗봇' : '🔔 알림'}
          </h3>
          <button className="close-btn" onClick={onClose}>
            ✕
          </button>
        </div>
        
        {activeSidebar === 'chatbot' ? <Chatbot /> : <Notification />}
      </div>
    </aside>
  );
}

export default RightSidebar;