import './FloatingButtons.css';

type SidebarType = 'chatbot' | 'notification' | null;

interface FloatingButtonsProps {
  activeSidebar: SidebarType;
  onToggle: (type: 'chatbot' | 'notification') => void;
}

function FloatingButtons({ activeSidebar, onToggle }: FloatingButtonsProps) {
  return (
    <div className="floating-buttons">
      <button
        className={`floating-btn ${activeSidebar === 'chatbot' ? 'active' : ''}`}
        onClick={() => onToggle('chatbot')}
        title="챗봇"
      >
        💬
      </button>
      <button
        className={`floating-btn ${activeSidebar === 'notification' ? 'active' : ''}`}
        onClick={() => onToggle('notification')}
        title="알림"
      >
        🔔
      </button>
    </div>
  );
}

export default FloatingButtons;