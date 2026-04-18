import { useNavigate } from 'react-router-dom';
import calendarIcon from '../assets/img/calendar_icon.png';
import documentIcon from '../assets/img/document_icon.png';
import communityIcon from '../assets/img/community_icon.png';
import { ReactNode } from 'react';
import HowItWorksSlider from '../components/homepage/HowitWorks';
import { useEffect } from 'react';
import { FaArrowRightLong } from "react-icons/fa6";
import './HomePage.css';

function useScrollReveal() {
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('revealed');
          } else {
            entry.target.classList.remove('revealed');
          }
        });
      },
      { threshold: 0 }
    );
    document.querySelectorAll('.reveal').forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);
}

function HomePage() {
  useScrollReveal();
  const navigate = useNavigate();
 
const features: { icon: ReactNode; title: string; desc: ReactNode }[] = [
    {
     icon: <img src={calendarIcon} alt="calendar" width={48} />,
      title: '일정 관리',
      desc: (
          <>
            계약서 내 중요한 날짜를 등록하고 <br />
            알림으로 놓치지 않게 관리하세요
          </>
        ),
    },
    {
      icon: <img src={documentIcon} alt="calendar" width={48} />,
      title: '법률 서식',
      desc: (
          <>
            필요한 법률 양식을 다운로드하여 <br />
            계약서 작성을 더 쉽게 진행하세요
          </>
        ),
    },
    {
      icon: <img src={communityIcon} alt="calendar" width={48} />,
      title: '커뮤니티',
      desc: (
          <>
            유사한 계약 경험을 가진 사람들의 <br />
            실제 사례를 확인하고 정보를 공유해보세요
          </>
        ),
    },
  ];
 
  // 로그인 여부에 따라 AI 분석 페이지 또는 로그인 페이지로 이동
  const handleCTA = () => {
    const token = localStorage.getItem('token');
    if (token) {
      navigate('/analysis');
    } else {
      navigate('/login', { state: { from: '/analysis' } }); // state 추가
    }
  };
 
  return (
    <div className="home-page">
 
      {/* ── Hero ── */}
      <section className="hero-section">
        <div className="hero-inner reveal">
          <h1 className="hero-title">
            복잡한 계약서를 쉽게 이해하도록<br />
            AI 법률 닥터<span className="hero-accent">AIDT</span>
          </h1>
          <p className="hero-sub">
            핵심 조항 요약부터 위험 탐지, 대응 가이드까지 <br />
            계약서 분석의 모든 것을 한 번에 알려드립니다
          </p>
          <button className="hero-cta-btn" onClick={handleCTA}>
             <span>지금 분석하기</span>
            <FaArrowRightLong className="cta-arrow" />
          </button>
        </div>
      </section>
 
      {/* ── 서비스 소개: How it works ── */}
      <section className="how-section">
        <div className="section-inner reveal">
          <h2 className="section-title">이렇게 사용해 보세요</h2>
          <p className="section-sub">복잡한 법률 지식 없이도 누구나 쉽게 사용할 수 있습니다</p>
          <HowItWorksSlider />
        </div>
      </section>
 
      {/* ── 부가 기능 소개 ── */}
      <section className="features-section">
        <div className="section-inner reveal">
          <h2 className="section-title">분석 이후의 과정도 법닥과 함께</h2>
          <p className="section-sub">계약 일정 관리, 필요한 서식 다운로드, 커뮤니티 사례 검색까지 한 곳에서</p>
          <div className="features-grid">
            {features.map((f) => (
              <div className="feature-card" key={f.title}>
                <span className="feature-icon">{f.icon}</span>
                <h3 className="feature-title">{f.title}</h3>
                <p className="feature-desc">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
 
      {/* ── Footer ── */}
      <footer className="home-footer">
        <div className="footer-inner reveal">
         
        </div>
      </footer>
    </div>
  );
}
 
export default HomePage;