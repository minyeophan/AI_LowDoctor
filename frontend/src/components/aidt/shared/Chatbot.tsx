import { useState, useRef, useEffect } from "react";
import ChatbotIcon from "../../../assets/img/ChatbotIcon.svg";
import ChatbotAvatar from "../../../assets/img/ChatboAvatar.svg";
import { RiSendPlane2Fill } from "react-icons/ri";
import { getChatHistory, sendChatMessage } from "../../../api/chat";
import "./Chatbot.css";

interface Message {
  id: number;
  role: "user" | "bot";
  content: string;
}

interface ChatbotProps {
  documentId?: string;
}

function Chatbot({ documentId }: ChatbotProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 문서 변경 시 채팅 기록 불러오기
  useEffect(() => {
    if (!documentId) return;
    const loadHistory = async () => {
      try {
        const history = await getChatHistory(documentId);
        if (history.messages?.length > 0) {
          const loaded = history.messages.map((m, i) => ({
            id: i,
            role: (m.role === "user" ? "user" : "bot") as "user" | "bot",
            content: m.content,
          }));
          setMessages(loaded);
        }
      } catch {
        // 기록 없으면 빈 상태로 시작
      }
    };
    loadHistory();
  }, [documentId]);

  // 메시지 추가 시 스크롤 하단 이동
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || isLoading) return;

    if (!documentId) {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now(),
          role: "bot",
          content: "먼저 계약서를 업로드해 주세요",
        },
      ]);
      return;
    }

    const userMsg: Message = {
      id: Date.now(),
      role: "user",
      content: text,
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    try {
      const result = await sendChatMessage(documentId, text);
      const botMsg: Message = {
        id: Date.now() + 1,
        role: "bot",
        content: result.answer || "응답이 없습니다.",
      };
      setMessages((prev) => [...prev, botMsg]);
    } catch (error: any) {
      const errorMsg: Message = {
        id: Date.now() + 1,
        role: "bot",
        content: `오류: ${error?.message || "챗봇 요청 실패"}`,
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") handleSend();
  };

  return (
    <div className="chatbot-container">
      <div className={`chat-messages ${messages.length === 0 ? "empty" : ""}`}>
        {messages.length === 0 ? (
          <div className="empty-state">
            <span className="empty-icon">
              <img src={ChatbotIcon} alt="챗봇" width={32} height={32} />
            </span>
            <p>AI 계약서 분석 도우미</p>
          </div>
        ) : (
          <>
            {messages.map((msg) => (
              <div key={msg.id} className={`message-row ${msg.role}`}>
                {msg.role === "bot" && (
                  <img
                    src={ChatbotAvatar}
                    alt="챗봇"
                    className="bot-avatar"
                    width={36}
                    height={36}
                  />
                )}
                <div className={`message-bubble ${msg.role}`}>{msg.content}</div>
              </div>
            ))}
            {isLoading && (
              <div className="message-row bot">
                <img
                  src={ChatbotAvatar}
                  alt="챗봇"
                  className="bot-avatar"
                  width={36}
                  height={36}
                />
                <div className="message-bubble bot typing">
                  <span />
                  <span />
                  <span />
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
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isLoading}
        />
        <button
          className="send-btn"
          onClick={handleSend}
          disabled={!input.trim() || isLoading}
        >
          <RiSendPlane2Fill />
        </button>
      </div>
    </div>
  );
}

export default Chatbot;