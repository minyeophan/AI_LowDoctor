import { useState, useRef, useEffect } from 'react';
import ChatbotIcon from '../../../assets/img/ChatbotIcon.svg';
import ChatbotAvatar from '../../../assets/img/ChatboAvatar.svg';
import { RiSendPlane2Fill } from "react-icons/ri";
import './Chatbot.css';

interface Message {
  id: number;
  role: 'user' | 'bot';
  content: string;
}

// mock 응답 (나중에 실제 API로 교체)
const getMockResponse = (input: string): string => {
  if (input.includes('관리비')) return '관리비 관련 조항은 계약서 3조에 명시되어 있으며, 부당청구 시 관련 법령에 따라 이의를 제기할 수 있습니다.';
  if (input.includes('계약')) return '계약 관련 내용은 민법 및 주택임대차보호법의 적용을 받습니다. 구체적인 조항을 확인해 드릴게요.';
  return '해당 내용에 대해 분석 중입니다. 계약서의 관련 조항을 검토한 결과를 알려드릴게요.';
};

function Chatbot() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || isLoading) return;

    const userMsg: Message = { id: Date.now(), role: 'user', content: text };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    setTimeout(() => {
      const botMsg: Message = {
        id: Date.now() + 1,
        role: 'bot',
        content: getMockResponse(text),
      };
      setMessages(prev => [...prev, botMsg]);
      setIsLoading(false);
    }, 800);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleSend();
  };

  return (
    <div className="chatbot-container">
      <div className={`chat-messages ${messages.length === 0 ? 'empty' : ''}`}>
        {messages.length === 0 ? (
          <div className="empty-state">
            <span className="empty-icon">
              <img src={ChatbotIcon} alt="챗봇" width={32} height={32} />
            </span>
            <p>AI 계약서 분석 도우미</p>
          </div>
        ) : (
          <>
            {messages.map(msg => (
              <div key={msg.id} className={`message-row ${msg.role}`}>
                {msg.role === 'bot' && (
                  <img src={ChatbotAvatar} alt="챗봇" className="bot-avatar" width={36} height={36} />
                )}
                <div className={`message-bubble ${msg.role}`}>
                  {msg.content}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="message-row bot">
                <img src={ChatbotAvatar} alt="챗봇" className="bot-avatar" width={36} height={36} />
                <div className="message-bubble bot typing">
                  <span /><span /><span />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      <div className="chat-input-area">
        <input
          type="text"
          placeholder="계약서 관련 질문을 입력해 주세요"
          className="chat-input"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <button className="send-btn" onClick={handleSend} disabled={!input.trim() || isLoading}>
          <RiSendPlane2Fill />
        </button>
      </div>
    </div>
  );
}

export default Chatbot;