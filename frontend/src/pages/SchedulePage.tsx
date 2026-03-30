import { useState } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import './SchedulePage.css';
import { IoSearch } from 'react-icons/io5';
import { IoAddCircleOutline } from 'react-icons/io5';
import { IoClose } from 'react-icons/io5';

export interface Schedule {
  id: string;
  title: string;
  startDate: string;      // 시작일
  endDate: string;        // 종료일
  type: '부동산';
  memo?: string;
  status: '진행중' | '종료';
  notification: boolean;
}

export const mockSchedules: Schedule[] = [
  { id: '1', title: '전세 계약 만료', startDate: '2026-03-25', endDate: '2026-03-28', type: '부동산', memo: '보증금 반환 확인 필요', status: '진행중', notification: true },
  { id: '2', title: '잔금 납부', startDate: '2026-03-30', endDate: '2026-03-30', type: '부동산', memo: '잔금 3,000만원', status: '진행중', notification: true },
];

export const calcDday = (date: string): string => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(date);
  target.setHours(0, 0, 0, 0);
  const diff = Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  if (diff === 0) return 'D-day';
  if (diff > 0) return `D-${diff}`;
  return `D+${Math.abs(diff)}`;
};

// 날짜 포맷 함수
const formatDate = (date: Date): string => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const TYPE_OPTIONS = ['전체', '부동산'];

export const typeColor: Record<string, string> = {
 '부동산': 'type-blue'
};

const ddayColor = (dday: string): string => {
  if (dday === 'D-day') return 'dday-urgent';
  if (dday.startsWith('D-')) {
    const n = parseInt(dday.replace('D-', ''));
    if (n <= 10) return 'dday-urgent';   
    if (n <= 30) return 'dday-soon';     
    return 'dday-normal';                
  }
  return 'dday-past';
};

// ============================
// 메인 컴포넌트
// ============================
export default function SchedulePage() {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [activeTab, setActiveTab] = useState<'진행중' | '종료'>('진행중');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('전체');
  const [showModal, setShowModal] = useState(false);
  const [editSchedule, setEditSchedule] = useState<Schedule | null>(null);

  // 백엔드 연동 시 아래로 교체
  // const [schedules, setSchedules] = useState<Schedule[]>([]);
  // useEffect(() => {
  //   const token = localStorage.getItem('token');
  //   fetch('/api/schedule', {
  //     headers: { Authorization: `Bearer ${token}` }
  //   })
  //   .then(res => res.json())
  //   .then(data => setSchedules(data));
  // }, []);
  const [schedules, setSchedules] = useState<Schedule[]>(mockSchedules);

  // 기간 내 일정 찾기 (캘린더 dot 표시용)
  const getSchedulesForDate = (dateStr: string) =>
    schedules.filter(s => s.startDate <= dateStr && s.endDate >= dateStr);

  // 해당 월 일정 (왼쪽 하단)
  const monthSchedules = schedules
    .filter(s => {
      const start = new Date(s.startDate);
      const end = new Date(s.endDate);
      const y = currentMonth.getFullYear();
      const m = currentMonth.getMonth();
      return (
        (start.getFullYear() === y && start.getMonth() === m) ||
        (end.getFullYear() === y && end.getMonth() === m)
      );
    })
    .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());

  // 오른쪽 전체 일정 필터링 (날짜 필터 없음)
  const filtered = schedules
    .filter(s => s.status === activeTab)
    .filter(s => selectedType === '전체' || s.type === selectedType)
    .filter(s => s.title.includes(searchQuery) || (s.memo ?? '').includes(searchQuery))
    .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());

  // 일정 등록/수정
  const handleSave = (form: Omit<Schedule, 'id'>) => {
    if (editSchedule) {
      // 백엔드 연동 시: PATCH /api/schedule/:id
      setSchedules(prev => prev.map(s => s.id === editSchedule.id ? { ...s, ...form } : s));
    } else {
      // 백엔드 연동 시: POST /api/schedule
      setSchedules(prev => [...prev, { ...form, id: Date.now().toString() }]);
    }
    setShowModal(false);
    setEditSchedule(null);
  };

  // 일정 삭제
  const handleDelete = (id: string) => {
    if (!window.confirm('일정을 삭제하시겠습니까?')) return;
    // 백엔드 연동 시: DELETE /api/schedule/:id
    setSchedules(prev => prev.filter(s => s.id !== id));
  };

  return (
    <div className="schedule-page">
      <div className="schedule-container">
        <div className="schedule-layout">
          {/* ===== 왼쪽: 캘린더 ===== */}
          <div className="schedule-left">
            <div className="calendar-wrapper">
              <Calendar
                onChange={(date) => {
                  if (date instanceof Date) {
                    const formatted = formatDate(date);
                    setSelectedDate(prev => prev === formatted ? null : formatted);
                  }
                }}
                onActiveStartDateChange={({ activeStartDate }) => {
                  if (activeStartDate) setCurrentMonth(activeStartDate);
                }}
                value={selectedDate ? new Date(selectedDate) : new Date()}
                tileContent={({ date, view }) => {
                  if (view === 'month') {
                    const dateStr = formatDate(date);
                    const daySchedules = getSchedulesForDate(dateStr);
                    if (daySchedules.length > 0) {
                      return (
                        <div className="calendar-dots">
                          {daySchedules.slice(0, 3).map((s, i) => (
                            <span key={i} className={`calendar-dot dot-${typeColor[s.type]}`} />
                          ))}
                        </div>
                      );
                    }
                  }
                  return null;
                }}
                tileClassName={({ date }) => {
                  const dateStr = formatDate(date);
                  if (dateStr === selectedDate) return 'selected-day';
                  if (getSchedulesForDate(dateStr).length > 0) return 'has-schedule';
                  return null;
                }}
                locale="ko-KR"
              />
            </div>

            {/* 해당 월 일정 목록 */}
            <div className="calendar-month-schedules">
              <p className="calendar-month-title">
                {currentMonth.getMonth() + 1}월 일정
              </p>
              {monthSchedules.length === 0 ? (
                <p className="calendar-month-empty">이번 달 일정이 없습니다.</p>
              ) : (
                monthSchedules.map(s => (
                  <div key={s.id} className="calendar-month-item">
                    <span className={`calendar-dot dot-${typeColor[s.type]}`} />
                    <span className="calendar-month-item-title">{s.title}</span>
                    <span className="calendar-month-item-date">{s.startDate.slice(5)}</span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* ===== 오른쪽: 전체 일정 목록 ===== */}
          <div className="schedule-right">
            <h1 className="schedule-page-title">일정 관리</h1>
            {/* 탭 */}
            <div className="schedule-tabs">
              <button
                className={`schedule-tab ${activeTab === '진행중' ? 'active' : ''}`}
                onClick={() => setActiveTab('진행중')}
              >
                진행중
                <span className="tab-count">{schedules.filter(s => s.status === '진행중').length}</span>
              </button>
              <button
                className={`schedule-tab ${activeTab === '종료' ? 'active' : ''}`}
                onClick={() => setActiveTab('종료')}
              >
                종료
                <span className="tab-count">{schedules.filter(s => s.status === '종료').length}</span>
              </button>
            </div>

            {/* 검색 + 필터 + 등록 */}
            <div className="schedule-filter-row">
              <div className="schedule-search-box">
                <input
                  type="text"
                  placeholder="일정 검색"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                />
                <span className="schedule-search-icon"><IoSearch /></span>
              </div>
              <select
                className="schedule-filter-select"
                value={selectedType}
                onChange={e => setSelectedType(e.target.value)}
              >
                {TYPE_OPTIONS.map(opt => <option key={opt}>{opt}</option>)}
              </select>
              <button
                className="schedule-add-btn"
                onClick={() => { setEditSchedule(null); setShowModal(true); }}
              >
                <IoAddCircleOutline size={16} />
                일정 등록
              </button>
            </div>

            {/* 일정 목록 */}
            <div className="schedule-list">
              {filtered.length === 0 ? (
                <div className="schedule-empty">일정이 없습니다.</div>
              ) : (
                filtered.map(schedule => {
                  const dday = calcDday(schedule.endDate);
                  return (
                    <div key={schedule.id} className="schedule-card">
                      {/* D-day 색상 점 */}
                        <span className={`schedule-dot ${ddayColor(dday)}`} />

                        {/* D-day */}
                        <span className={`schedule-dday-text ${ddayColor(dday)}`}>{dday}</span>

                        <div className="schedule-card-divider" />

                        {/* 카테고리 뱃지 */}
                        <span className={`schedule-type-badge ${typeColor[schedule.type]}`}>
                            {schedule.type}
                        </span>

                        {/* 제목 */}
                        <span className="schedule-card-title-inline">{schedule.title}</span>

                        <div className="schedule-card-divider" />

                        {/* 날짜 */}
                        <span className="schedule-card-date-inline">
                            [{schedule.endDate.slice(2).replace(/-/g, '.')}]
                        </span>

                        {/* 알림 */}
                        <span className="schedule-notification-icon">
                            {schedule.notification ? '🔔' : '🔕'}
                        </span>

                        {/* 더보기 버튼 */}
                        <div className="schedule-card-menu">
                            <button className="schedule-menu-btn" onClick={() => { setEditSchedule(schedule); setShowModal(true); }}>
                            ✏️
                            </button>
                            <button className="schedule-menu-btn delete" onClick={() => handleDelete(schedule.id)}>
                            🗑️
                            </button>
                        </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 일정 등록/수정 모달 */}
      {showModal && (
        <ScheduleModal
          schedule={editSchedule}
          onSave={handleSave}
          onClose={() => { setShowModal(false); setEditSchedule(null); }}
        />
      )}
    </div>
  );
}

// ============================
// 일정 등록/수정 모달
// ============================
interface ModalProps {
  schedule: Schedule | null;
  onSave: (form: Omit<Schedule, 'id'>) => void;
  onClose: () => void;
}

function ScheduleModal({ schedule, onSave, onClose }: ModalProps) {
  const [title, setTitle] = useState(schedule?.title ?? '');
  const [startDate, setStartDate] = useState(schedule?.startDate ?? '');
  const [endDate, setEndDate] = useState(schedule?.endDate ?? '');
  const [type, setType] = useState<Schedule['type']>(schedule?.type ?? '부동산');
  const [memo, setMemo] = useState(schedule?.memo ?? '');
  const [status, setStatus] = useState<Schedule['status']>(schedule?.status ?? '진행중');
  const [notification, setNotification] = useState(schedule?.notification ?? false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !startDate || !endDate) return;
    onSave({ title, startDate, endDate, type, memo, status, notification });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">{schedule ? '일정 수정' : '일정 등록'}</h2>
          <button className="modal-close-btn" onClick={onClose}>
            <IoClose size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="modal-field">
            <label className="modal-label">제목 *</label>
            <input
              className="modal-input"
              placeholder="일정 제목을 입력하세요"
              value={title}
              onChange={e => setTitle(e.target.value)}
              maxLength={50}
              required
            />
          </div>

          <div className="modal-field">
            <label className="modal-label">카테고리 *</label>
            <select
              className="modal-select"
              value={type}
              onChange={e => setType(e.target.value as Schedule['type'])}
            >
              <option value="부동산">부동산</option>
            </select>
          </div>

          <div className="modal-field">
            <label className="modal-label">기간 *</label>
            <div className="modal-date-row">
              <input
                className="modal-input"
                type="date"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                required
              />
              <span className="modal-date-separator">~</span>
              <input
                className="modal-input"
                type="date"
                value={endDate}
                min={startDate}
                onChange={e => setEndDate(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="modal-field">
            <label className="modal-label">상태</label>
            <select
              className="modal-select"
              value={status}
              onChange={e => setStatus(e.target.value as Schedule['status'])}
            >
              <option value="진행중">진행중</option>
              <option value="종료">종료</option>
            </select>
          </div>

          <div className="modal-field">
            <label className="modal-label">메모</label>
            <textarea
              className="modal-textarea"
              placeholder="메모를 입력하세요"
              value={memo}
              onChange={e => setMemo(e.target.value)}
              rows={3}
            />
          </div>

          <div className="modal-field">
            <label className="modal-checkbox-label">
              <input
                type="checkbox"
                checked={notification}
                onChange={e => setNotification(e.target.checked)}
                className="modal-checkbox"
              />
              <span>🔔 알림 설정</span>
            </label>
            <p className="modal-hint">알림을 설정하면 일정 하루 전에 알려드려요</p>
          </div>

          <div className="modal-actions">
            <button type="button" className="modal-cancel-btn" onClick={onClose}>취소</button>
            <button type="submit" className="modal-save-btn">
              {schedule ? '수정하기' : '등록하기'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}