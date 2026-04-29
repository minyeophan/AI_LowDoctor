import { useState } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { IoClose } from 'react-icons/io5';
import { MdAccountCircle } from "react-icons/md";
import './Setting.css';

export default function Settings() {
  const { user, updateUser, logout } = useAuth();
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
const [profileName, setProfileName] = useState(user?.name ?? '');
  // 알림 설정 (백엔드 연동 시 API 호출로 교체)
  const [notifications, setNotifications] = useState({
    schedule: true,
    email: false,
    marketing: false,
  });

  return (
    <div className="settings-page">
      <div className="settings-container">
        <h1 className="settings-title">설정</h1>

      {/* ===== 프로필 섹션 ===== */}
      <div className="settings-section">
        <p className="settings-section-title">프로필</p>
        <div className="settings-card">
          <div className="settings-profile-inner">
            {/* 프로필 사진 - 클릭 시 파일 업로드 */}
            <label className="settings-avatar-label">
              <div className="settings-avatar">
                {user?.avatar ? (
                  <img src={user.avatar} alt="프로필" className="settings-avatar-img" />
                ) : (
                  <MdAccountCircle size={64} color="#d0d0d0" />
                )}
                <div className="settings-avatar-overlay">변경</div>
              </div>
              <input
                type="file"
                accept="image/*"
                className="settings-avatar-input"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const url = URL.createObjectURL(file);
                    // 백엔드 연동 시: PATCH /api/auth/avatar
                    updateUser({ avatar: url });
                  }
                }}
              />
            </label>

            {/* 이름 + 저장 */}
            <div className="settings-profile-name-wrap">
              <p className="settings-profile-label">이름</p>
              <div className="settings-profile-name-row">
                <input
                  className="settings-profile-name-input"
                  value={profileName}
                  onChange={e => setProfileName(e.target.value)}
                />
                <button
                  className="settings-profile-save-btn"
                  onClick={() => {
                    // 백엔드 연동 시: PATCH /api/auth/profile
                    updateUser({ name: profileName });
                  }}
                >
                  저장
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>


        
        {/* ===== 계정 섹션 ===== */}
        <div className="settings-section">
          <p className="settings-section-title">계정</p>
          <div className="settings-card">
            <button
              className="settings-row"
              onClick={() => setShowPasswordModal(true)}
            >
              <span className="settings-row-label">비밀번호 변경</span>
              <span className="settings-row-arrow">›</span>
            </button>
            <button
              className="settings-row danger"
              onClick={() => setShowWithdrawModal(true)}
            >
              <span className="settings-row-label">회원 탈퇴</span>
              <span className="settings-row-arrow">›</span>
            </button>
          </div>
        </div>

        {/* ===== 알림 섹션 ===== */}
        <div className="settings-section">
          <p className="settings-section-title">알림</p>
          <div className="settings-card">
            <div className="settings-row">
              <div>
                <p className="settings-row-label">일정 알림</p>
                <p className="settings-row-sub">D-day 하루 전 이메일 수신</p>
              </div>
              <button
                className={`settings-toggle ${notifications.schedule ? 'on' : ''}`}
                onClick={() => setNotifications(p => ({ ...p, schedule: !p.schedule }))}
              >
                <span className="settings-toggle-thumb" />
              </button>
            </div>
            <div className="settings-row">
              <div>
                <p className="settings-row-label">이메일 알림</p>
                <p className="settings-row-sub">주요 업데이트 수신</p>
              </div>
              <button
                className={`settings-toggle ${notifications.email ? 'on' : ''}`}
                onClick={() => setNotifications(p => ({ ...p, email: !p.email }))}
              >
                <span className="settings-toggle-thumb" />
              </button>
            </div>
          </div>
        </div>

        {/* ===== 서비스 정보 섹션 ===== */}
        <div className="settings-section">
          <p className="settings-section-title">서비스 정보</p>
          <div className="settings-card">
            <button className="settings-row" onClick={() => setShowTermsModal(true)}>
              <span className="settings-row-label">이용약관</span>
              <span className="settings-row-arrow">›</span>
            </button>
            <button className="settings-row" onClick={() => setShowPrivacyModal(true)}>
              <span className="settings-row-label">개인정보 처리방침</span>
              <span className="settings-row-arrow">›</span>
            </button>
            <div className="settings-row">
              <span className="settings-row-label">버전 정보</span>
              <span className="settings-version">v1.0.0</span>
            </div>
          </div>
        </div>
      </div>

      {/* ===== 프로필 수정 모달 ===== */}
      {showProfileModal && (
        <ProfileModal
          user={user}
          onSave={(data) => {
            // 백엔드 연동 시: PATCH /api/auth/profile
            updateUser(data);
            setShowProfileModal(false);
          }}
          onClose={() => setShowProfileModal(false)}
        />
      )}

      {/* ===== 비밀번호 변경 모달 ===== */}
      {showPasswordModal && (
        <PasswordModal onClose={() => setShowPasswordModal(false)} />
      )}

      {/* ===== 회원 탈퇴 모달 ===== */}
      {showWithdrawModal && (
        <WithdrawModal
          onConfirm={() => {
            // 백엔드 연동 시: DELETE /api/auth/user
            logout();
          }}
          onClose={() => setShowWithdrawModal(false)}
        />
      )}

      {/* ===== 이용약관 모달 ===== */}
      {showTermsModal && (
        <InfoModal
          title="이용약관"
          content={TERMS_CONTENT}
          onClose={() => setShowTermsModal(false)}
        />
      )}

      {/* ===== 개인정보 처리방침 모달 ===== */}
      {showPrivacyModal && (
        <InfoModal
          title="개인정보 처리방침"
          content={PRIVACY_CONTENT}
          onClose={() => setShowPrivacyModal(false)}
        />
      )}
    </div>
  );
}

// ============================
// 프로필 수정 모달
// ============================
function ProfileModal({
  user,
  onSave,
  onClose,
}: {
  user: any;
  onSave: (data: any) => void;
  onClose: () => void;
}) {
  const [name, setName] = useState(user?.name ?? '');
  const [birthYear, setBirthYear] = useState('');
  const [email, setEmail] = useState(user?.email ?? '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSave({ name, email });
  };

  return (
    <div className="settings-modal-overlay" onClick={onClose}>
      <div className="settings-modal" onClick={e => e.stopPropagation()}>
        <div className="settings-modal-header">
          <h2 className="settings-modal-title">프로필 수정</h2>
          <button className="settings-modal-close" onClick={onClose}>
            <IoClose size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="settings-modal-form">
          {/* 프로필 사진 */}
          <div className="settings-modal-avatar-wrap">
            <div className="settings-modal-avatar">
              {name.charAt(0) || '?'}
            </div>
            <button type="button" className="settings-avatar-change-btn">
              사진 변경
              {/* 백엔드 연동 시: input type="file" + PATCH /api/auth/avatar */}
            </button>
          </div>

          <div className="settings-modal-field">
            <label className="settings-modal-label">이름</label>
            <input
              className="settings-modal-input"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="이름을 입력하세요"
              required
            />
          </div>

          <div className="settings-modal-field">
            <label className="settings-modal-label">생년월일</label>
            <select
              className="settings-modal-select"
              value={birthYear}
              onChange={e => setBirthYear(e.target.value)}
            >
              <option value="">선택하세요</option>
              {Array.from({ length: 100 }, (_, i) => 2024 - i).map(y => (
                <option key={y} value={y}>{y}년</option>
              ))}
            </select>
          </div>

          <div className="settings-modal-field">
            <label className="settings-modal-label">이메일</label>
            <input
              className="settings-modal-input"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="이메일을 입력하세요"
            />
          </div>

          <div className="settings-modal-actions">
            <button type="button" className="settings-modal-cancel" onClick={onClose}>취소</button>
            <button type="submit" className="settings-modal-save">저장</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ============================
// 비밀번호 변경 모달
// ============================
function PasswordModal({ onClose }: { onClose: () => void }) {
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (next !== confirm) {
      setError('새 비밀번호가 일치하지 않습니다.');
      return;
    }
    if (next.length < 8) {
      setError('비밀번호는 8자 이상이어야 합니다.');
      return;
    }
    // 백엔드 연동 시: PATCH /api/auth/password
    alert('비밀번호가 변경됐습니다.');
    onClose();
  };

  return (
    <div className="settings-modal-overlay" onClick={onClose}>
      <div className="settings-modal" onClick={e => e.stopPropagation()}>
        <div className="settings-modal-header">
          <h2 className="settings-modal-title">비밀번호 변경</h2>
          <button className="settings-modal-close" onClick={onClose}>
            <IoClose size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="settings-modal-form">
          <div className="settings-modal-field">
            <label className="settings-modal-label">현재 비밀번호</label>
            <input className="settings-modal-input" type="password" value={current} onChange={e => setCurrent(e.target.value)} required />
          </div>
          <div className="settings-modal-field">
            <label className="settings-modal-label">새 비밀번호</label>
            <input className="settings-modal-input" type="password" value={next} onChange={e => setNext(e.target.value)} placeholder="8자 이상" required />
          </div>
          <div className="settings-modal-field">
            <label className="settings-modal-label">새 비밀번호 확인</label>
            <input className="settings-modal-input" type="password" value={confirm} onChange={e => setConfirm(e.target.value)} required />
          </div>
          {error && <p className="settings-modal-error">{error}</p>}
          <div className="settings-modal-actions">
            <button type="button" className="settings-modal-cancel" onClick={onClose}>취소</button>
            <button type="submit" className="settings-modal-save">변경하기</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ============================
// 회원 탈퇴 모달
// ============================
function WithdrawModal({
  onConfirm,
  onClose,
}: {
  onConfirm: () => void;
  onClose: () => void;
}) {
  const [password, setPassword] = useState('');
  const [step, setStep] = useState<1 | 2>(1);

  return (
    <div className="settings-modal-overlay" onClick={onClose}>
      <div className="settings-modal" onClick={e => e.stopPropagation()}>
        <div className="settings-modal-header">
          <h2 className="settings-modal-title" style={{ color: '#DC2626' }}>회원 탈퇴</h2>
          <button className="settings-modal-close" onClick={onClose}>
            <IoClose size={20} />
          </button>
        </div>

        {step === 1 ? (
          <div className="settings-modal-form">
            <div className="settings-withdraw-warning">
              <p className="settings-withdraw-title">정말 탈퇴하시겠습니까?</p>
              <ul className="settings-withdraw-list">
                <li>모든 계약서 분석 내역이 삭제됩니다.</li>
                <li>등록한 일정이 모두 삭제됩니다.</li>
                <li>커뮤니티 게시글 및 댓글이 삭제됩니다.</li>
                <li>탈퇴 후 동일한 이메일로 재가입이 어려울 수 있습니다.</li>
              </ul>
            </div>
            <div className="settings-modal-actions">
              <button className="settings-modal-cancel" onClick={onClose}>취소</button>
              <button className="settings-modal-danger" onClick={() => setStep(2)}>계속하기</button>
            </div>
          </div>
        ) : (
          <div className="settings-modal-form">
            <p className="settings-modal-label" style={{ marginBottom: 12 }}>
              탈퇴를 확인하려면 비밀번호를 입력하세요.
            </p>
            <div className="settings-modal-field">
              <label className="settings-modal-label">비밀번호</label>
              <input
                className="settings-modal-input"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="현재 비밀번호"
              />
            </div>
            <div className="settings-modal-actions">
              <button className="settings-modal-cancel" onClick={onClose}>취소</button>
              <button
                className="settings-modal-danger"
                onClick={onConfirm}
                disabled={!password}
              >
                탈퇴하기
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================
// 이용약관 / 개인정보 처리방침 모달
// ============================
function InfoModal({
  title,
  content,
  onClose,
}: {
  title: string;
  content: string;
  onClose: () => void;
}) {
  return (
    <div className="settings-modal-overlay" onClick={onClose}>
      <div className="settings-modal settings-modal-lg" onClick={e => e.stopPropagation()}>
        <div className="settings-modal-header">
          <h2 className="settings-modal-title">{title}</h2>
          <button className="settings-modal-close" onClick={onClose}>
            <IoClose size={20} />
          </button>
        </div>
        <div className="settings-modal-content">
          <p style={{ whiteSpace: 'pre-line', fontSize: 14, lineHeight: 1.8, color: 'var(--color-text-secondary)' }}>
            {content}
          </p>
        </div>
      </div>
    </div>
  );
}

// ============================
// 이용약관 내용
// ============================
const TERMS_CONTENT = `제1조 (목적)
본 약관은 법닥(이하 "서비스")이 제공하는 AI 기반 부동산 계약서 분석 서비스의 이용에 관한 조건 및 절차, 기타 필요한 사항을 규정함을 목적으로 합니다.

제2조 (서비스 이용)
본 서비스는 부동산 계약서 분석을 위한 AI 도구를 제공하며, 법적 조언을 대체하지 않습니다. 중요한 계약 사항은 반드시 전문가와 상담하시기 바랍니다.

제3조 (개인정보)
서비스 이용 시 수집된 개인정보는 개인정보 처리방침에 따라 처리됩니다.

제4조 (면책조항)
AI 분석 결과는 참고용이며, 법적 효력이 없습니다. 분석 결과에 따른 손해에 대해 서비스는 책임지지 않습니다.`;

const PRIVACY_CONTENT = `1. 수집하는 개인정보 항목
이름, 이메일 주소, 비밀번호, 업로드한 계약서 파일

2. 개인정보 수집 및 이용 목적
- 서비스 제공 및 계약서 분석
- 일정 관리 서비스 제공
- 커뮤니티 서비스 제공
- 고객 문의 응대

3. 개인정보 보유 및 이용 기간
회원 탈퇴 시까지 보관하며, 탈퇴 즉시 파기합니다.

4. 개인정보 제3자 제공
수집된 개인정보는 제3자에게 제공하지 않습니다.

5. 문의
개인정보 관련 문의사항은 서비스 내 문의하기를 통해 연락주세요.`;