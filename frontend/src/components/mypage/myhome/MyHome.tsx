import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { mypageAPI } from '../../../api/mypage';
import { calendarAPI } from '../../../api/calendar';
import '../myhome/MyHome.css';
import { FaBoxArchive } from "react-icons/fa6";
import { FaPen } from "react-icons/fa";
import { FaCalendarCheck } from "react-icons/fa";
import { BsPeopleFill } from "react-icons/bs";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

interface RiskSummary {
  high: number;
  medium: number;
  low: number;
  total: number;
  docTitle: string;
  docDate: string;
  docId: string;
}

interface UpcomingSchedule {
  id: string;
  title: string;
  endDate: string;
  dday: string;
  ddayColor: string;
}

const calcDday = (date: string): { label: string; color: string } => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(date);
  target.setHours(0, 0, 0, 0);
  const diff = Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  if (diff === 0) return { label: 'D-day', color: '#E53E3E' };
  if (diff > 0) {
    if (diff <= 10) return { label: `D-${diff}`, color: '#E53E3E' };
    if (diff <= 30) return { label: `D-${diff}`, color: '#FF6C1D' };
    return { label: `D-${diff}`, color: '#4099FD' };
  }
  return { label: `D+${Math.abs(diff)}`, color: '#9CA3AF' };
};

const RISK_COLORS = ['#fa1a1a', '#FF6C1D', '#FFC72F'];

const COLOR_MAP: Record<string, string> = {
  '높음': '#fa1a1a',
  '중간': '#FF6C1D',
  '낮음': '#FFC72F',
};

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const { name, value } = payload[0];
  return (
    <div style={{
      backgroundColor: '#ffffff', 
      opacity: 1,    
      border: `1px solid ${COLOR_MAP[name]}`,
      borderRadius: '8px',
      padding: '8px 12px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
      fontSize: '12px',
      fontWeight: 600,
      color: COLOR_MAP[name],
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
    }}>
      <span style={{
        width: '8px',
        height: '8px',
        borderRadius: '50%',
        background: COLOR_MAP[name],
        display: 'inline-block',
        flexShrink: 0,
        
      }} />
      {name} {value}건
    </div>
  );
};

export default function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    documentCount: 0,
    draftCount: 0,
    scheduleCount: 0,
    activityCount: 0,
  });
  const [riskSummary, setRiskSummary] = useState<RiskSummary>({
    high: 0, medium: 0, low: 0, total: 0, docTitle: '', docDate: '', docId: ''
  });
  const [upcomingSchedules, setUpcomingSchedules] = useState<UpcomingSchedule[]>([]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [storageRes, draftRes, postsRes, commentsRes, likedRes] = await Promise.all([
          mypageAPI.getStorage(),
          mypageAPI.getDrafts(),
          mypageAPI.getCommunityArchive('posts'),
          mypageAPI.getCommunityArchive('comments'),
          mypageAPI.getCommunityArchive('liked'),
        ]);

        setStats(prev => ({
          ...prev,
          documentCount: storageRes.total,
          draftCount: draftRes.total,
          activityCount: (postsRes.total ?? 0) + (commentsRes.total ?? 0) + (likedRes.total ?? 0),
        }));

        const list = storageRes.list || [];
        if (list.length > 0) {
          const latest = list[0];
          let high = 0, medium = 0, low = 0;
          (latest.riskItems || []).forEach((item: any) => {
            const level = (item.riskLevel || item.severity || '').toUpperCase();
            if (level === 'HIGH') high++;
            else if (level === 'MEDIUM') medium++;
            else if (level === 'LOW') low++;
          });
          setRiskSummary({
            high, medium, low,
            total: high + medium + low,
            docTitle: latest.title || '계약서',
            docDate: latest.uploadDate || '',
            docId: latest.documentId || '',
          });
        }
      } catch (err) {
        console.error('홈 통계 로딩 실패:', err);
      }
    };

    const fetchSchedules = async () => {
      try {
        const res = await calendarAPI.getSchedules();
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const upcoming = (res.list || [])
          .filter((s: any) => new Date(s.endDate) >= today)
          .sort((a: any, b: any) => new Date(a.endDate).getTime() - new Date(b.endDate).getTime())
          .slice(0, 4)
          .map((s: any) => {
            const { label, color } = calcDday(s.endDate.slice(0, 10));
            return {
              id: s._id,
              title: s.scheduleName,
              endDate: s.endDate.slice(0, 10),
              dday: label,
              ddayColor: color,
            };
          });

        setUpcomingSchedules(upcoming);
        setStats(prev => ({ ...prev, scheduleCount: upcoming.length }));
      } catch (err) {
        console.error('일정 로딩 실패:', err);
      }
    };

    fetchStats();
    fetchSchedules();
  }, []);

  const donutData = [
    { name: '높음', value: riskSummary.high },
    { name: '중간', value: riskSummary.medium },
    { name: '낮음', value: riskSummary.low },
  ].filter(d => d.value > 0);

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h1>홈</h1>
      </header>

      {/* 내 활동 기록 */}
      <section className="activity-section">
        <h2 className="my-section-title">내 활동 기록</h2>
        <div className="activity-grid">
          <div className="activity-card">
            <div className="card-icon-wrapper">
              <span className="card-icon"><FaBoxArchive /></span>
            </div>
            <h3 className="card-title">보관 중 계약서</h3>
            <p className="card-count">{stats.documentCount}건</p>
          </div>
          <div className="activity-card">
            <div className="card-icon-wrapper">
              <span className="card-icon"><FaPen /></span>
            </div>
            <h3 className="card-title">작성 중 계약서</h3>
            <p className="card-count">{stats.draftCount}건</p>
          </div>
          <div className="activity-card">
            <div className="card-icon-wrapper">
              <span className="card-icon"><FaCalendarCheck /></span>
            </div>
            <h3 className="card-title">다가오는 일정</h3>
            <p className="card-count">{stats.scheduleCount}건</p>
          </div>
          <div className="activity-card">
            <div className="card-icon-wrapper">
              <span className="card-icon"><BsPeopleFill /></span>
            </div>
            <h3 className="card-title">커뮤니티 참여</h3>
            <p className="card-count">{stats.activityCount}건</p>
          </div>
        </div>
      </section>

      {/* 하단 섹션 */}
      <section className="analysis-section">
        <div className="analysis-grid">

          {/* 왼쪽 — 최근 계약서 위험도 분포 */}
          {riskSummary.docTitle && (
          <div className="analysis-card gray">
            <div className="analysis-card-header">
              <div style={{ flex: 1, minWidth: 0 }}>
                <h3 className="analysis-card-title">최근 분석 계약서 현황</h3>
                {riskSummary.docTitle && (
                  <p className="analysis-card-doc">
                    {/* 2번 수정: 계약서 이름 전체 표시 (자르기 제거) */}
                    {riskSummary.docTitle}
                    {riskSummary.docDate && ` · ${riskSummary.docDate}`}
                  </p>
                )}
              </div>
              
              {/* 3번 수정: 보관함 바로 이동 버튼 */}
              <button
                className="analysis-card-link"
                onClick={() => navigate('/mypage/documents')}
              >
                보관함 →
              </button>
            </div>

            {riskSummary.total === 0 ? (
              <div className="analysis-empty">
                <p>분석된 계약서가 없습니다</p>
                <span>계약서를 분석하고 보관함에 저장하면<br />위험 조항 현황을 확인할 수 있어요</span>
                <button className="analysis-empty-btn" onClick={() => navigate('/ai')}>
                  계약서 분석하러 가기 →
                </button>
              </div>
            ) : (
              <div className="risk-summary-content">
                {/* 1번 수정: 도넛 차트 얇게 — innerRadius 68, outerRadius 95 */}
                <div style={{ position: 'relative', width: '100%', height: 220 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart style={{ outline: 'none' }}>
                      <Pie
                        data={donutData}
                        cx="50%"
                        cy="50%"
                        innerRadius={62}
                        outerRadius={95}
                        paddingAngle={2}
                        dataKey="value"
                        strokeWidth={0}
                        style={{ outline: 'none' }}
                      >
                        {donutData.map((_, index) => (
                          <Cell key={index} fill={RISK_COLORS[index]} style={{ outline: 'none' }} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} 
                      wrapperStyle={{ zIndex: 9999 }}/>
                    </PieChart>
                  </ResponsiveContainer>
                  {/* 중앙 텍스트 */}
                  <div className="donut-center">
                    <span className="donut-total">{riskSummary.total}</span>
                    <span className="donut-label">총 위험 조항</span>
                  </div>
                </div>

                {/* 범례 */}
                <div className="risk-legend">
                  <div className="risk-legend-item">
                    <span className="risk-dot-sm" style={{ background: '#fa1a1a' }} />
                    <span className="risk-legend-name">높음</span>
                    <span className="risk-legend-value">{riskSummary.high}건</span>
                  </div>
                  <div className="risk-legend-item">
                    <span className="risk-dot-sm" style={{ background: '#FF6C1D' }} />
                    <span className="risk-legend-name">중간</span>
                    <span className="risk-legend-value">{riskSummary.medium}건</span>
                  </div>
                  <div className="risk-legend-item">
                    <span className="risk-dot-sm" style={{ background: '#FFC72F' }} />
                    <span className="risk-legend-name">낮음</span>
                    <span className="risk-legend-value">{riskSummary.low}건</span>
                  </div>
                </div>

                {/* 코멘트 */}
                <p className="risk-comment">
                  {riskSummary.high > 0
                    ? `높음 위험 조항 ${riskSummary.high}건이 발견됐어요. 대응 가이드를 확인해보세요.`
                    : riskSummary.medium > 0
                    ? `주의가 필요한 조항 ${riskSummary.medium}건이 있어요. 꼼꼼히 살펴보세요.`
                    : '위험 조항이 없는 안전한 계약서예요 👍'}
                </p>
              </div>
            )}
          </div>
)}   
          {/* 오른쪽 — 다가오는 일정 */}
          <div className="analysis-card blue">
            <div className="analysis-card-header">
              <h3 className="analysis-card-title">다가오는 일정</h3>
              <button className="analysis-card-link" onClick={() => navigate('/schedule')}>
                전체보기 →
              </button>
            </div>

            {upcomingSchedules.length === 0 ? (
              <div className="analysis-empty">
                <p>다가오는 일정이 없습니다</p>
                <span>일정 관리 페이지에서<br />계약 일정을 등록해보세요</span>
              </div>
            ) : (
              <div className="upcoming-list">
                {upcomingSchedules.map(s => (
                  <div key={s.id} className="upcoming-item">
                    <span className="upcoming-dday" style={{ color: s.ddayColor }}>{s.dday}</span>
                    <span className="upcoming-title">{s.title}</span>
                    <span className="upcoming-date">{s.endDate.slice(5).replace('-', '.')}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </section>
    </div>
  );
}