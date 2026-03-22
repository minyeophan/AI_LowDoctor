import { useState, useRef, useEffect } from 'react';
import ChatbotIcon from '../../../assets/img/ChatbotIcon.svg';
import ChatbotAvatar from '../../../assets/img/ChatboAvatar.svg';
import { RiSendPlane2Fill } from "react-icons/ri";
import { chatAPI } from '../../../api/chat';
import './Chatbot.css';

interface Message {
  id: number;
  role: 'user' | 'bot';
  content: string;
}

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

    try {
      const result = await chatAPI.ask(text);

      const botMsg: Message = {
        id: Date.now() + 1,
        role: 'bot',
        content: result.answer || '관련 정보를 찾을 수 없습니다.',
      };

      setMessages(prev => [...prev, botMsg]);
    } catch (error) {
      const botMsg: Message = {
        id: Date.now() + 1,
        role: 'bot',
        content: error instanceof Error
          ? `오류: ${error.message}`
          : '오류: 챗봇 요청 중 문제가 발생했습니다.',
      };

      setMessages(prev => [...prev, botMsg]);
    } finally {
      setIsLoading(false);
    }
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