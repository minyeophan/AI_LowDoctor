# AI 법률 닥터 (AI_LawDoctor)
**AI 기반 부동산 계약서 위험 분석 웹 서비스**

AI 기반으로 부동산 계약서의 위험 조항을 자동 탐지하고,
법적 근거와 대응 가이드를 제공하는 웹 서비스입니다.

## 주요 기능
- **계약서 분석** (OCR → 위험 조항 탐지 → 위험도 판단 → 대응 가이드 제공)
- **계약서 요약** (주요 내용 항목별 정리)
- **위험 조항 탐지** (위험도 분류 및 이유 제공)
- **대응 가이드** (위험 조항 개선 방법 제안)
- **법률 서식 추천 및 다운로드** (계약 해지 통보서, 내용증명 등) *(예정)*
- **기한 알림 캘린더 연동** *(예정)*
- **Q&A 커뮤니티 / 사례 공유** *(예정)*

## 기술 스택
- **AI/OCR**: Python + pdfplumber / Tesseract OCR + Gemini API (gemini-2.5-flash)
- **Frontend**: React + Vite (TypeScript)
- **Backend**: Node.js + Express
- **DB**: MongoDB Atlas
- **Infra**: Docker / Docker Compose
- **기타**: JWT 인증 *(예정)*, 국가법령정보센터 연동 *(예정)*

## 폴더 구조

```
AI_LawDoctor/
├── AI/
│   ├── ai_api.py              # FastAPI 서버 진입점 (포트 8000)
│   ├── analysis/
│   │   └── ai_example.py      # Gemini API 계약서 분석 모듈
│   ├── ocr/
│   │   └── ocr_example.py     # PDF/이미지 텍스트 추출 모듈
│   ├── requirements.txt       # Python 패키지 목록
│   └── Dockerfile
│
├── backend/
│   ├── src/
│   │   ├── controllers/       # 요청 처리 로직
│   │   ├── routes/            # 라우터 모음
│   │   ├── schemas/           # Mongoose 스키마
│   │   ├── service/           # AI 서버 연동 서비스
│   │   └── app.js             # Express 서버 진입점 (포트 3001)
│   ├── uploads/               # 업로드된 파일 저장
│   ├── package.json
│   └── Dockerfile
│
├── frontend/
│   ├── src/
│   │   ├── pages/             # 페이지 컴포넌트
│   │   ├── components/        # 재사용 UI 컴포넌트
│   │   ├── api/               # API 요청 모듈
│   │   ├── context/           # React Context
│   │   ├── mock/              # 목업 데이터
│   │   └── types/             # TypeScript 타입 정의
│   ├── .env                   # 환경 변수 (VITE_API_BASE_URL, VITE_API_URL)
│   ├── nginx.conf
│   ├── package.json
│   └── Dockerfile
│
├── docs/
│   ├── api_spec.md            # API 명세
│   ├── data_spec.md           # 데이터 스펙
│   └── dev_guide.md           # 개발자 가이드
│
├── samples/                   # 테스트용 샘플 계약서
├── docker-compose.yml
└── README.md
```

## 실행 방법

### Docker로 실행 (권장)

1. `.env` 파일 설정
   - `AI/.env` → `GEMINI_API_KEY=your_key`
   - `backend/.env` → `MONGO_URL=your_mongodb_atlas_url`
   - `frontend/.env` → `VITE_API_BASE_URL=http://localhost:3001/api`, `VITE_API_URL=http://localhost:3001`

2. 빌드 및 실행
```bash
docker-compose up --build
```

3. 접속
   - 프론트엔드: http://localhost:80
   - 백엔드 API: http://localhost:3001
   - AI 서버: http://localhost:8000

### 개별 실행 (개발용)

**AI 서버 (Python)**
```bash
cd AI
pip install -r requirements.txt
uvicorn ai_api:app --host 0.0.0.0 --port 8000
```

**백엔드 (Node.js)**
```bash
cd backend
npm install
npm start
```

**프론트엔드 (React + Vite)**
```bash
cd frontend
npm install
npm run dev
```
브라우저: http://localhost:5173

## 개발자 코드 작성 가이드

👉 [개발자 코드 작성 가이드라인 보기](docs/dev_guide.md)
