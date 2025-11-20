import './Notification.css';

function Notification() {
  return (
    <div className="notification-container">
      <div className="notification-item">
        <p className="notification-text">일정 등록</p>
        <span className="notification-time">5분 전</span>
      </div>
    </div>
  );
}

export default Notification;