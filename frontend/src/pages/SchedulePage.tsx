import { useState } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import './SchedulePage.css';
import { IoSearch } from 'react-icons/io5';
import { IoClose } from 'react-icons/io5';
import { BiSolidBell, BiSolidBellOff } from "react-icons/bi";
import { MdError } from "react-icons/md";

export interface Schedule {
  id: string;
  title: string;
  startDate: string;
  endDate: string;
  type: '부동산';
  eventType: '계약체결' | '잔금납부' | '입주' | '계약만료' | '전입신고' | '확정일자' | '기타';
  memo?: string;
  notification: boolean;
}

export const mockSchedules: Schedule[] = [
  {
    id: '1',
    title: '전세 계약 만료',
    startDate: '2026-03-25',
    endDate: '2026-05-28',
    type: '부동산',
    eventType: '계약만료',
    memo: '보증금 반환 확인 필요',
    notification: true,
  },
  {
    id: '2',
    title: '잔금 납부',
    startDate: '2026-04-30',
    endDate: '2026-04-30',
    type: '부동산',
    eventType: '잔금납부',
    memo: '잔금 3,000만원',
    notification: true,
  },
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

export const getStatus = (endDate: string): '진행중' | '종료' => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(endDate);
  target.setHours(0, 0, 0, 0);
  return target < today ? '종료' : '진행중';
};

const formatDate = (date: Date): string => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const TYPE_OPTIONS = ['전체', '부동산'];

export const typeColor: Record<string, string> = {
  '부동산': 'cat-blue',
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
  const [sortOrder, setSortOrder] = useState<'dday' | 'latest'>('dday');
  const [selectedType, setSelectedType] = useState('전체');
  const [showModal, setShowModal] = useState(false);
  const [editSchedule, setEditSchedule] = useState<Schedule | null>(null);
  const [schedules, setSchedules] = useState<Schedule[]>(mockSchedules);
const [detailSchedule, setDetailSchedule] = useState<Schedule | null>(null);
const [isDdayGuideOpen, setIsDdayGuideOpen] = useState(false);

 const getSchedulesForDate = (dateStr: string) =>
  schedules.filter(s => {
    if (s.eventType === '계약체결') {
      // 시작일과 종료일만 표시
      return s.startDate === dateStr || s.endDate === dateStr;
    }
    return s.endDate === dateStr;
  });

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

const filtered = schedules
  .filter(s => getStatus(s.endDate) === activeTab)
  .filter(s => selectedType === '전체' || s.type === selectedType)
  .filter(s => s.title.includes(searchQuery) || (s.memo ?? '').includes(searchQuery))
  .sort((a, b) => {
    if (sortOrder === 'dday') {
      // D-day 순 (가까운 날짜 먼저)
      return new Date(a.endDate).getTime() - new Date(b.endDate).getTime();
    }
    // 최신 등록 순
    return new Date(b.startDate).getTime() - new Date(a.startDate).getTime();
  });

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
                formatDay={(locale, date) => date.getDate().toString()}
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
                calendarType="gregory"
              />
            </div>

            {/* 범례 */}
            <div className="calendar-legend">
              <div className="legend-item">
                <span className="legend-dot dot-cat-blue" />
                <span className="legend-label">부동산</span>
              </div>
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
            <div className="sliding-tabs" style={{ marginBottom: '24px' }}>
              <div className="tabs-wrapper">
                <button
                  className={`tab-btn ${activeTab === '진행중' ? 'active' : ''}`}
                  onClick={() => setActiveTab('진행중')}
                >
                  진행중
                </button>
                <button
                  className={`tab-btn ${activeTab === '종료' ? 'active' : ''}`}
                  onClick={() => setActiveTab('종료')}
                >
                  종료
                </button>
                <div
                  className="tab-slider"
                  style={{ transform: activeTab === '진행중' ? 'translateX(0)' : 'translateX(100%)' }}
                />
              </div>
            </div>

            {/* 검색 + 필터 + 등록 */}
            <div className="controls-area">
              <div className="search-box">
                <input
                  type="text"
                  placeholder="일정을 검색하세요"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                />
                <button className="search-btn">
                  <span><IoSearch /></span>
                </button>
              </div>
              <div className="filters">
                <select
                  className="filter-select"
                  value={selectedType}
                  onChange={e => setSelectedType(e.target.value)}
                >
                  {TYPE_OPTIONS.map(opt => <option key={opt}>{opt}</option>)}
                </select>
                <select
                  className="filter-select"
                  value={sortOrder}
                  onChange={e => setSortOrder(e.target.value as 'dday' | 'latest')}
                >
                  <option value="dday">D-day 순</option>
                  <option value="latest">최신 등록 순</option>
                </select>
              </div>
              <button
                className="btn-create"
                onClick={() => { setEditSchedule(null); setShowModal(true); }}
              >
                +&nbsp; 일정 등록
              </button>
            </div>

            {/* D-day 색상 안내 */}
            <div className="schedule-info-wrapper">
             <div className="schedule-info-icon-wrap"
                
              >
                <span className="schedule-info-icon">
                  <MdError onMouseEnter={() => setIsDdayGuideOpen(true)}
                onMouseLeave={() => setIsDdayGuideOpen(false)}/>
                </span>
                <p>D-day 색상 안내</p>
                {isDdayGuideOpen && (
                  <div className="schedule-guide-content">
                    <div className="schedule-guide-list">
                      <div className="schedule-guide-item">
                        <span className="schedule-guide-dot urgent" />
                        <div className="schedule-guide-text">
                          <strong>10일 이내</strong>
                          <p>임박한 일정입니다. 빠른 확인이 필요합니다.</p>
                        </div>
                      </div>
                      <div className="schedule-guide-item">
                        <span className="schedule-guide-dot soon" />
                        <div className="schedule-guide-text">
                          <strong>30일 이내</strong>
                          <p>곧 다가오는 일정입니다. 미리 준비하세요.</p>
                        </div>
                      </div>
                      <div className="schedule-guide-item">
                        <span className="schedule-guide-dot normal" />
                        <div className="schedule-guide-text">
                          <strong>30일 초과</strong>
                          <p>여유있는 일정입니다.</p>
                        </div>
                      </div>
                      <div className="schedule-guide-item">
                        <span className="schedule-guide-dot past" />
                        <div className="schedule-guide-text">
                          <strong>기간 종료</strong>
                          <p>종료된 일정입니다.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* 일정 목록 */}
            <div className="schedule-list">
              {filtered.length === 0 ? (
                <div className="schedule-empty">일정이 없습니다.</div>
              ) : (
                filtered.map(schedule => {
                  const dday = calcDday(schedule.endDate);
                  return (
                    <div key={schedule.id} className="schedule-card" onClick={() => setDetailSchedule(schedule)} style={{ cursor: 'pointer' }}>
                      <span className={`schedule-dot ${ddayColor(dday)}`} />
                      <span className={`schedule-dday-text ${ddayColor(dday)}`}>{dday}</span>
                      <div className="schedule-card-divider" />
                      <span className={`schedule-type-badge ${typeColor[schedule.type]}`}>
                        {schedule.type}
                      </span>
                      <span className="schedule-card-title-inline">{schedule.title}</span>
                      <div className="schedule-card-divider" />
                      <span className="schedule-card-date-inline">
                        [{schedule.endDate.slice(2).replace(/-/g, '.')}]
                      </span>
                      <span className="schedule-notification-icon">
                        {schedule.notification
                          ? <BiSolidBell size={18} color="#F7CB46" />
                          : <BiSolidBellOff size={18} color="#a2a2a2" />
                        }
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>

      {showModal && (
        <ScheduleModal
          schedule={editSchedule}
          onSave={handleSave}
          onClose={() => { setShowModal(false); setEditSchedule(null); }}
        />
      )}

            {detailSchedule && (
        <ScheduleDetailModal
          schedule={detailSchedule}
          onClose={() => setDetailSchedule(null)}
          onEdit={() => {
            setDetailSchedule(null);
            setEditSchedule(detailSchedule);
            setShowModal(true);
          }}
          onDelete={() => {
            setDetailSchedule(null);
            handleDelete(detailSchedule.id);
          }}
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
  const [eventType, setEventType] = useState<Schedule['eventType']>(schedule?.eventType ?? '기타');
  const [memo, setMemo] = useState(schedule?.memo ?? '');
  const [notification, setNotification] = useState(schedule?.notification ?? false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !endDate) return;
    onSave({ title, startDate, endDate, type, eventType, memo, notification });
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
          {/* 제목 */}
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

          {/* 카테고리 */}
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

          {/* 일정 유형 */}
          <div className="modal-field">
            <label className="modal-label">일정 유형 *</label>
            <select
              className="modal-select"
              value={eventType}
              onChange={e => setEventType(e.target.value as Schedule['eventType'])}
            >
              <option value="계약체결">계약 체결일</option>
              <option value="잔금납부">잔금 납부일</option>
              <option value="입주">입주일</option>
              <option value="계약만료">계약 만료일</option>
              <option value="전입신고">전입신고 기한</option>
              <option value="확정일자">확정일자 기한</option>
              <option value="기타">기타</option>
            </select>
          </div>

          {/* 기간 */}
          <div className="modal-field">
            <label className="modal-label">
              {eventType === '계약체결' ? '계약 기간 *' : 'D-day 날짜 *'}
            </label>
            {eventType === '계약체결' ? (
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
            ) : (
              <input
                className="modal-input"
                type="date"
                value={endDate}
                onChange={e => {
                  setEndDate(e.target.value);
                  setStartDate(e.target.value);
                }}
                required
              />
            )}
          </div>

          {/* 메모 */}
          <div className="modal-field">
            <label className="modal-label">메모</label>
            <textarea
              className="modal-textarea"
              placeholder="메모를 입력하세요"
              value={memo}
              onChange={e => setMemo(e.target.value)}
              rows={2}
            />
          </div>

          {/* 알림 */}
          <div className="modal-field">
            <label className="modal-checkbox-label">
              <input
                type="checkbox"
                checked={notification}
                onChange={e => setNotification(e.target.checked)}
                className="modal-checkbox"
              />
              <span className='modal-bell-set'>
                <BiSolidBell color="#F7CB46"/> 알림 설정
              </span>
              
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

function ScheduleDetailModal({
  schedule,
  onClose,
  onEdit,
  onDelete,
}: {
  schedule: Schedule;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const dday = calcDday(schedule.endDate);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">일정 상세</h2>
          <button className="modal-close-btn" onClick={onClose}>
            <IoClose size={20} />
          </button>
        </div>

        <div className="detail-modal-body">
          {/* D-day */}
          <div className="detail-dday-wrap">
            <span className={`detail-dday ${ddayColor(dday)}`}>{dday}</span>
          </div>

          {/* 정보 목록 */}
          <div className="detail-info-list">
            <div className="detail-info-row">
              <span className="detail-info-label">제목</span>
              <span className="detail-info-value">{schedule.title}</span>
            </div>
            <div className="detail-info-row">
              <span className="detail-info-label">카테고리</span>
              <span className={`schedule-type-badge ${typeColor[schedule.type]}`}>
                {schedule.type}
              </span>
            </div>
            <div className="detail-info-row">
              <span className="detail-info-label">일정 유형</span>
              <span className="detail-info-value">{schedule.eventType}</span>
            </div>
            <div className="detail-info-row">
              <span className="detail-info-label">기간</span>
              <span className="detail-info-value">
                {schedule.startDate === schedule.endDate
                  ? schedule.endDate
                  : `${schedule.startDate} ~ ${schedule.endDate}`
                }
              </span>
            </div>
            <div className="detail-info-row">
              <span className="detail-info-label">알림</span>
              <span className="detail-info-value">
                {schedule.notification ? <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <BiSolidBell size={18} color="#F7CB46" />
                  <span>설정됨</span>
                </span> :  
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}> 
                <BiSolidBellOff size={18} color="#a2a2a2" /> <span>미설정</span>
                </span>
                
                }
              </span>
            </div>
            {schedule.memo && (
              <div className="detail-info-row">
                <span className="detail-info-label">메모</span>
                <span className="detail-info-value detail-memo">{schedule.memo}</span>
              </div>
            )}
          </div>
        </div>

        <div className="modal-actions">
          <button className="modal-cancel-btn" onClick={onDelete} style={{ color: '#DC2626', borderColor: '#fecaca' }}>
            삭제
          </button>
          <button className="modal-save-btn" onClick={onEdit}>
            수정하기
          </button>
        </div>
      </div>
    </div>
  );
}