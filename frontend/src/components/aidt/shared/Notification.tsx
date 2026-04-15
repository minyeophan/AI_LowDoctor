import { useState } from 'react';
import { Schedule } from '../../../pages/SchedulePage';
import { BiSolidBell} from "react-icons/bi";
import { FaCaretUp, FaCaretDown} from "react-icons/fa";
import './Notification.css';

type EventType = Schedule['eventType'];

const EVENT_TYPE_OPTIONS: { value: EventType; label: string }[] = [
  { value: '계약체결', label: '계약 체결일' },
  { value: '잔금납부', label: '잔금 납부일' },
  { value: '입주', label: '입주일' },
  { value: '계약만료', label: '계약 만료일' },
  { value: '전입신고', label: '전입신고 기한' },
  { value: '확정일자', label: '확정일자 기한' },
  { value: '기타', label: '기타' },
];

const mockAutoSchedules: Omit<Schedule, 'id'>[] = [
  { title: '계약 체결', eventType: '계약체결', type: '부동산', startDate: '2026-03-01', endDate: '2026-03-01', notification: true },
  { title: '잔금 납부', eventType: '잔금납부', type: '부동산', startDate: '2026-05-01', endDate: '2026-05-01', notification: true },
  { title: '입주', eventType: '입주', type: '부동산', startDate: '2026-05-05', endDate: '2026-05-05', notification: true },
  { title: '계약 만료', eventType: '계약만료', type: '부동산', startDate: '2028-03-01', endDate: '2028-03-01', notification: true },
];

function Notification() {
  const [schedules, setSchedules] = useState<Omit<Schedule, 'id'>[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [expanded, setExpanded] = useState<Set<number>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  const handleAutoDetect = () => {
    setIsLoading(true);
    setTimeout(() => {
      setSchedules(mockAutoSchedules);
      setSelected(new Set());
      setIsLoading(false);
    }, 1000);
  };

  const handleSelect = (index: number) => {
  setSelected(prev => {
    const next = new Set(prev);
    if (next.has(index)) next.delete(index);
    else next.add(index);
    return next;
  });
};

  const handleCardClick = (index: number) => {
    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };


  const updateSchedule = (index: number, updates: Partial<Omit<Schedule, 'id'>>) => {
    setSchedules(prev => prev.map((item, i) => i === index ? { ...item, ...updates } : item));
  };

  const handleRegister = () => {
    console.log('등록할 일정:', schedules.filter((_, i) => selected.has(i)));
    setIsComplete(true);
  };

  const getEventTypeLabel = (value: EventType) =>
    EVENT_TYPE_OPTIONS.find(o => o.value === value)?.label || value;

  return (
    <div className="notification-container">
      {schedules.length === 0 ? (
        <div className="notification-empty">
          <button className="auto-detect-btn" onClick={handleAutoDetect} disabled={isLoading}>
            {isLoading ? '분석 중...' : '계약서에서 일정 찾기'}
          </button>
        </div>
      ) : isComplete ? (
        <div className="notification-complete">
          <p>일정이 등록되었습니다!</p>
        </div>
      ) : (
        <>
          <div className="schedule-list-auto">
            <div className='shedule-list-box'>
            {schedules.map((s, i) => (
              <div
                key={i}
                className={`schedule-auto-item ${selected.has(i) ? 'selected' : ''}`}
              >
                {/* 토글 전 - 항상 보이는 영역 */}
                <div className="auto-schedule-top" onClick={() => handleCardClick(i)}>
                  <input
                    type="checkbox"
                    checked={selected.has(i)}
                    onChange={() => handleSelect(i)}
                    onClick={e => e.stopPropagation()}
                    className="auto-checkbox"
                  />
                  <span className="auto-category-badge">부동산</span>
                  <span className="auto-event-type">{getEventTypeLabel(s.eventType)}</span>
                  <span className="auto-schedule-date">
                    {s.startDate === s.endDate ? s.endDate : `${s.startDate} ~ ${s.endDate}`}
                  </span>
                  <span className="auto-toggle-icon">{expanded.has(i) ? <FaCaretUp size={18}/> : <FaCaretDown size={18}/>}</span>
                </div>

                {/* 토글 후 - 수정 가능한 영역 */}
                {expanded.has(i) && (
                  <div className="auto-schedule-expanded" onClick={e => e.stopPropagation()}>
                    {/* 제목 */}
                    <div className="auto-field">
                      <label className="auto-field-label">제목</label>
                      <input
                        className="auto-field-input"
                        value={s.title}
                        onChange={e => updateSchedule(i, { title: e.target.value })}
                        placeholder="일정 제목을 입력하세요"
                      />
                    </div>

                    {/* 일정 유형 */}
                    <div className="auto-field">
                      <label className="auto-field-label">일정 유형</label>
                      <select
                        className="auto-field-select"
                        value={s.eventType}
                        onChange={e => updateSchedule(i, { eventType: e.target.value as EventType })}
                      >
                        {EVENT_TYPE_OPTIONS.map(opt => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    </div>

                    {/* 기간 */}
                    <div className="auto-field">
                      <label className="auto-field-label">
                        {s.eventType === '계약체결' ? '계약 기간' : 'D-day 날짜'}
                      </label>
                      {s.eventType === '계약체결' ? (
                        <div className="auto-date-row">
                          <input
                            className="auto-field-input"
                            type="date"
                            value={s.startDate}
                            onChange={e => updateSchedule(i, { startDate: e.target.value })}
                          />
                          <span>~</span>
                          <input
                            className="auto-field-input"
                            type="date"
                            value={s.endDate}
                            onChange={e => updateSchedule(i, { endDate: e.target.value })}
                          />
                        </div>
                      ) : (
                        <input
                          className="auto-field-input"
                          type="date"
                          value={s.endDate}
                          onChange={e => updateSchedule(i, { startDate: e.target.value, endDate: e.target.value })}
                        />
                      )}
                    </div>

                    {/* 알림 설정 */}
                    <label className="auto-notification-label">
                      <input
                        type="checkbox"
                        className='noti-checkbox'
                        checked={s.notification}
                        onChange={e => updateSchedule(i, { notification: e.target.checked })}
                      />
                      <span><BiSolidBell color="#F7CB46" size={14}/>  알림 설정</span>
                    </label>
                  </div>
                )}
              </div>
            ))}</div>
          </div>

          {/* 하단 등록 영역 */}
          <div className="notification-footer">
            <span className="selected-count">{selected.size}개 선택됨</span>
            <button
              className="register-schedule-btn"
              onClick={handleRegister}
              disabled={selected.size === 0}
            >
              일정 등록
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default Notification;