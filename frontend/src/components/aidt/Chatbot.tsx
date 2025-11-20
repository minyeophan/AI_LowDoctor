import { FaHouseChimneyCrack } from "react-icons/fa6";
import './Chatbot.css';

function Chatbot() {
  return (
    <div className="chatbot-container">
      <div className="chat-messages">
        <div className="empty-state">
          <span className="empty-icon">
             <FaHouseChimneyCrack size={35} color='#a4a9aeff'/>
          </span>
          <p>궁금한 점을 물어보세요!</p>
        </div>
      </div>
      <div className="chat-input-area">
        <input 
          type="text" 
          placeholder="궁금한 점을 물어보세요" 
          className="chat-input"
        />
        <button className="send-btn">➤</button>
      </div>
    </div>
  );
}

export default Chatbot;