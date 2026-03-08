import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './FloatingButtons.css';
import { GoBellFill } from "react-icons/go";
import { FaSave } from "react-icons/fa";
import { IoLogOut } from "react-icons/io5";
import { IoMdCheckmark } from "react-icons/io";
import ChatbotLogo from '../../../assets/img/ChatbotLogo.svg';

type SidebarType = 'chatbot' | 'notification' | null;

interface FloatingButtonsProps {
  activeSidebar: SidebarType;
  onToggle: (type: 'chatbot' | 'notification') => void;
}

function FloatingButtons({ activeSidebar, onToggle }: FloatingButtonsProps) {
  const navigate = useNavigate();
  const [showExitModal, setShowExitModal] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showSaveComplete, setShowSaveComplete] = useState(false);

  const handleExit = () => {
    navigate('/');
  };

  return (
    <>
      <div className="floating-buttons-container">
        <div className="floating-buttons">
          <button
            className={`floating-btn ${activeSidebar === 'chatbot' ? 'active' : ''}`}
            onClick={() => onToggle('chatbot')}
            title="챗봇"
          >
             <img src={ChatbotLogo} width={16} />
            <span className='fbtn-span'>챗봇</span>
          </button>
          <button
            className={`floating-btn ${activeSidebar === 'notification' ? 'active' : ''}`}
            onClick={() => onToggle('notification')}
            title="알림"
          >
            <GoBellFill size={20} color='FFC908' />
            <span className='fbtn-span'>일정</span>
          </button>
        </div>

        {/* 하단 버튼들 */}
        <div className="floating-buttons-bottom">
          <button className="floating-btn save-btn" title="저장" onClick={() => setShowSaveModal(true)}>
            <FaSave size={20} color='#FFFFFF' />
            <span className='fbtn-span'>저장</span>
          </button>
          <button
            className="floating-btn exit-btn"
            title="나가기"
            onClick={() => setShowExitModal(true)}
          >
            <IoLogOut size={20} color='#FFFFFF' />
            <span className='fbtn-span'>나가기</span>
          </button>
        </div>
      </div>

      {/* 나가기 확인 모달 */}
      {showExitModal && (
        <div className="exit-modal-overlay">
          <div className="exit-modal">
            <p className="exit-modal-text">정말 나가시겠습니까?</p>
            <p className="exit-modal-sub">분석 중인 내용이 저장되지 않을 수 있습니다.</p>
            <div className="exit-modal-buttons">
              <button className="exit-cancel-btn" onClick={() => setShowExitModal(false)}>
                취소
              </button>
              <button className="exit-confirm-btn" onClick={handleExit}>
                확인
              </button>
            </div>
          </div>
        </div>
      )}

           {/* 저장 확인 모달 */}
          {showSaveModal && (
            <div className="save-modal-overlay">
              <div className="save-modal">
                <p className="save-modal-text">분석한 내용을 저장하시겠습니까?</p>
                <div className="save-modal-buttons">
                  <button className="save-cancel-btn" onClick={() => setShowSaveModal(false)}>
                    취소
                  </button>
                  <button className="save-confirm-btn" onClick={() => {
                    setShowSaveModal(false);
                    setShowSaveComplete(true);
                    setTimeout(() => {
                      setShowSaveComplete(false);
                      navigate('/');
                    }, 2000);
                  }}>
                    저장
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 저장 완료 모달 */}
          {showSaveComplete && (
            <div className="save-modal-overlay">
              <div className="save-modal">
                <p className="save-modal-text " style={{margin: 0}}>
                  <IoMdCheckmark /> 저장되었습니다</p>
              </div>
            </div>
          )}
    </>
  );
}

export default FloatingButtons;