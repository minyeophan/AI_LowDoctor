import { useState, useEffect, useRef, useCallback } from 'react';
import step1Gif from '../../assets/gif/step1.gif';
import step2Gif from '../../assets/gif/step2.gif';
import step3Gif from '../../assets/gif/step3.gif';
import './Howitwork.css';

interface Chip {
  text: string;
}

interface Slide {
  step: string;
  title: string;
  chips: Chip[];
  colorKey: 'blue' | 'green' | 'purple';
  imageSrc: string;
  imageAlt: string;
}

const SLIDES: Slide[] = [
  {
    step: 'STEP 01',
    title: '계약서를\n업로드하세요',
    colorKey: 'blue',
    chips: [
      { text: 'PDF, HWP, DOC, TXT 지원' },
      { text: '드래그 앤 드롭으로 간편하게' },
      { text: '현재 부동산 관련 계약서 지원' },
    ],
    imageSrc: step1Gif,
    imageAlt: '계약서 업로드 화면',
  },
  {
    step: 'STEP 02',
    title: 'AI가 계약서를\n분석합니다',
    colorKey: 'green',
    chips: [
      { text: '핵심 내용 자동 요약' },
      { text: '위험 조항 탐지' },
      { text: '조항별 대응 가이드 제공' },
    ],
    imageSrc: step2Gif,
    imageAlt: 'AI 분석 결과 화면',
  },
  {
    step: 'STEP 03',
    title: '계약서에 대해\n더 알아보세요',
    colorKey: 'purple',
    chips: [
      { text: 'AI 챗봇으로 추가 질문' },
      { text: '유사 사례 커뮤니티∙판례 검색' },
      { text: '계약 일정 자동 감지 및 등록' },
    ],
    imageSrc: step3Gif,
    imageAlt: '계약 관리 화면',
  },
];

const AUTOPLAY_INTERVAL = 6000;

function SlideVisual({ slide }: { slide: Slide }) {
  return (
    <div className={`slide__visual slide__visual--${slide.colorKey}`}>
      <img src={slide.imageSrc} alt={slide.imageAlt} className="slide__image" />
    </div>
  );
}

export default function HowItWorksSlider() {
  const [current, setCurrent] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const progressTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const total = SLIDES.length;

  const stopTimers = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (progressTimerRef.current) clearInterval(progressTimerRef.current);
  };

  const startTimers = useCallback(() => {
    stopTimers();
    const tick = AUTOPLAY_INTERVAL / 100;
    progressTimerRef.current = setInterval(() => {}, tick);
    timerRef.current = setInterval(() => {
      setCurrent((prev) => (prev + 1) % total);
    }, AUTOPLAY_INTERVAL);
  }, [total]);

  useEffect(() => {
    startTimers();
    return () => stopTimers();
  }, [current, startTimers]);

  const goTo = (idx: number) => {
    setCurrent((idx + total) % total);
  };

  return (
    <div className="slider-wrap">
      <div
        className="slides"
        style={{ transform: `translateX(-${current * 100}%)` }}
      >
        {SLIDES.map((s, i) => (
          <div className={`slide slide--${s.colorKey}`} key={i}>
            <div className="slide__left">
              <span className={`slide__badge slide__badge--${s.colorKey}`}>{s.step}</span>
              <h2 className="slide__title">
                {s.title.split('\n').map((line, j) => (
                  <span key={j}>{line}<br /></span>
                ))}
              </h2>
              <ul className="slide__chips">
                {s.chips.map((chip, j) => (
                  <li className="slide__chip" key={j}>
                    <span className={`slide__chip-dot slide__chip-dot--${s.colorKey}`} />
                    {chip.text}
                  </li>
                ))}
              </ul>
            </div>
            <SlideVisual slide={s} />
          </div>
        ))}
      </div>

      <div className="controls">
        <button className="controls__btn" onClick={() => goTo(current - 1)} aria-label="이전 슬라이드">
          <svg viewBox="0 0 14 14" fill="none" width="14" height="14">
            <path d="M9 2L4 7L9 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <button className="controls__btn" onClick={() => goTo(current + 1)} aria-label="다음 슬라이드">
          <svg viewBox="0 0 14 14" fill="none" width="14" height="14">
            <path d="M5 2L10 7L5 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <span className="controls__label">{current + 1} / {total}</span>
      </div>

      <div className="indicators">
        {SLIDES.map((s, i) => (
          <button
            key={i}
            className={`indicator ${i === current ? `indicator--active indicator--${s.colorKey}` : ''}`}
            onClick={() => goTo(i)}
            aria-label={`${i + 1}번 슬라이드로 이동`}
          />
        ))}
      </div>
    </div>
  );
}