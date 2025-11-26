import './FloatingButtons.css';
import { RiChatAiFill } from "react-icons/ri";
import { GoBellFill } from "react-icons/go";
import { FaSave } from "react-icons/fa";

type SidebarType = 'chatbot' | 'notification' | null;

interface FloatingButtonsProps {
  activeSidebar: SidebarType;
  onToggle: (type: 'chatbot' | 'notification') => void;
}

function FloatingButtons({ activeSidebar, onToggle}: FloatingButtonsProps) {
  return (
    <div className="floating-buttons-container">
      <div className="floating-buttons">
        <button
          className={`floating-btn ${activeSidebar === 'chatbot' ? 'active' : ''}`}
          onClick={() => onToggle('chatbot')}
          title="챗봇"
        >
          <RiChatAiFill size={20} color='4E84C1'/>
          <span className='fbtn-span'>챗봇</span>
        </button>
        <button
          className={`floating-btn ${activeSidebar === 'notification' ? 'active' : ''}`}
          onClick={() => onToggle('notification')}
          title="알림"
        >
          <GoBellFill size={20} color='FFC908'/>
          <span className='fbtn-span'>일정</span>
        </button>
      </div>
      {/* 하단 저장 버튼 */}
      <div className="floating-buttons-bottom">
        <button
          className="floating-btn save-btn"
          title="저장"
        >
          <FaSave size={20} color='#FFFFFF'/>
          <span className='fbtn-span'>저장</span>
        </button>
      </div>
    </div>
  );
}

export default FloatingButtons;