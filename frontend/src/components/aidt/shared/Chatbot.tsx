import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import ChatbotIcon from "../../../assets/img/ChatbotIcon.svg";
import ChatbotAvatar from "../../../assets/img/ChatboAvatar.svg";
import { RiSendPlane2Fill } from "react-icons/ri";
import {
  GENERAL_CHAT_ID,
  getChatHistory,
  sendChatMessage,
} from "../../../api/chat";
import "./Chatbot.css";

interface Message {
  id: number;
  role: "user" | "bot";
  content: string;
}

interface ChatbotProps {
  documentId?: string;
}

const MESSAGE_VISIBLE_LIMIT = 30;

const INITIAL_MESSAGE = "계약서 관련 법률 질문을 해보세요. 분석된 계약서가 있다면 해당 내용을 바탕으로 답변해 드려요.";

function Chatbot({ documentId }: ChatbotProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showAllMessages, setShowAllMessages] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const activeChatId = GENERAL_CHAT_ID;

  useEffect(() => {
    const loadHistory = async () => {
      try {
        const history = await getChatHistory();

        if (history.messages?.length > 0) {
          const loaded = history.messages.map((m, i) => ({
            id: i + 1,
            role: (m.role === "user" ? "user" : "bot") as "user" | "bot",
            content: m.content,
          }));
          setMessages(loaded);
        } else {
          setMessages([{ id: 1, role: "bot", content: INITIAL_MESSAGE }]);
        }
      } catch (error) {
        console.error("채팅 기록 불러오기 실패:", error);
        setMessages([{ id: 1, role: "bot", content: INITIAL_MESSAGE }]);
      }
    };

    setShowAllMessages(false);
    loadHistory();
  }, [activeChatId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading, showAllMessages]);

  const hiddenMessageCount = Math.max(messages.length - MESSAGE_VISIBLE_LIMIT, 0);

  const visibleMessages =
    showAllMessages || messages.length <= MESSAGE_VISIBLE_LIMIT
      ? messages
      : messages.slice(-MESSAGE_VISIBLE_LIMIT);

  const parseSiteGuide = (content: string) => {
    if (!content.includes("[사이트안내]")) return null;

    const pageNameMatch = content.match(/페이지명:\s*(.*)/);
    const descriptionMatch = content.match(/설명:\s*(.*)/);
    const pathMatch = content.match(/경로:\s*(.*)/);
    const buttonTextMatch = content.match(/버튼텍스트:\s*(.*)/);

    return {
      pageName: pageNameMatch?.[1]?.trim() || "",
      description: descriptionMatch?.[1]?.trim() || "",
      path: pathMatch?.[1]?.trim() || "",
      buttonText: buttonTextMatch?.[1]?.trim() || "이동하기",
    };
  };

  const handleSend = async () => {
    const text = input.trim();
    if (!text || isLoading) return;

    const userMsg: Message = { id: Date.now(), role: "user", content: text };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);
    setShowAllMessages(false);

    try {
      const result = await sendChatMessage(documentId, text, window.location.pathname);

      // MongoDB 오류 메시지 등 서버 오류 응답 필터링
      const answer = result.answer;
      const content =
        !answer || answer.startsWith("오류:")
          ? "일시적인 오류가 발생했어요. 다시 시도해주세요."
          : answer;

      const botMsg: Message = { id: Date.now() + 1, role: "bot", content };
      setMessages((prev) => [...prev, botMsg]);
    } catch (error: any) {
      console.error("챗봇 요청 실패:", error);

      const status = error?.status || error?.response?.status;
      let message = "일시적인 오류가 발생했어요. 다시 시도해주세요.";

      if (status === 401) {
        message = "로그인 후 이용할 수 있어요.";
      } else if (status === 429) {
        message = "요청이 많아 잠시 지연되고 있어요. 잠시 후 다시 시도해주세요.";
      } else if (status === 503) {
        message = "AI 서비스가 일시적으로 혼잡해요. 잠시 기다렸다가 다시 질문해주세요.";
      }

      const errorMsg: Message = { id: Date.now() + 1, role: "bot", content: message };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !isLoading) {
      e.preventDefault();
      handleSend();
    }
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
            {hiddenMessageCount > 0 && !showAllMessages && (
              <div className="chat-more-wrapper">
                <button
                  type="button"
                  className="chat-more-button"
                  onClick={() => setShowAllMessages(true)}
                >
                  이전 대화 {hiddenMessageCount}개 보기
                </button>
              </div>
            )}

            {showAllMessages && hiddenMessageCount > 0 && (
              <div className="chat-more-wrapper">
                <button
                  type="button"
                  className="chat-more-button"
                  onClick={() => setShowAllMessages(false)}
                >
                  최근 대화로 돌아가기
                </button>
              </div>
            )}

            {visibleMessages.map((msg) => {
              const siteGuide = msg.role === "bot" ? parseSiteGuide(msg.content) : null;

              return (
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
                  <div className={`message-bubble ${msg.role}`}>
                    {siteGuide && siteGuide.path ? (
                      <div className="site-guide-card">
                        <div className="site-guide-title">{siteGuide.pageName}</div>
                        <div className="site-guide-desc">{siteGuide.description}</div>
                        <button
                          type="button"
                          className="site-guide-button"
                          onClick={() => navigate(siteGuide.path)}
                        >
                          {siteGuide.buttonText}
                        </button>
                      </div>
                    ) : (
                      <span>{msg.content}</span>
                    )}
                  </div>
                </div>
              );
            })}

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
          placeholder="법률 질문이나 사이트 사용법을 입력해 주세요"
          className="chat-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isLoading}
        />
        <button
          type="button"
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