# AI 법률 닥터_프로젝트 개요

AI 기반으로 부동 계약서의 위험 조항을 분석하고, <br/>
법적 근거와 대응 가이드를 제공하는 웹 서비스입니다.<br/>

## 주요 기능
- **계약서 분석** (OCR + 위험조항 탐지 + 대응 가이드)
- **법령 근거 자동 연결**
- **법률 서식 추천 및 다운로드**
- **기한 알림 캘린더 연동**
- **Q&A 커뮤니티 (예정)**

## 기술 스택
- **AI/OCR**: Python + Tesseract OCR + OpenAI API(RAG 기반 LangChain 구조 예정)<br/>
- **Frontend**: React<br/>
- **Backend**: Node.js + Express<br/>
- **DB**: MongoDB 또는 Firebase / PostgreSQL<br/>
- **Infra**: 로컬 기반 + 시연용 서버<br/>
- **기타**: JWT 인증, Google Calendar API, 국가법령정보센터 연동 등


## 폴더 구조

AI_LAWDOCTOR/ <br/>
├── AI/ <br/>
│   ├── analysis/ <br/>
│   │   └── ai_example.py     # 계약서 텍스트 ⇒ 위험 조항 분석 예시<br/>
│   ├── ocr/ <br/>
│   │   └── ocr_example.py   # 이미지/PDF ⇒ 텍스트 추출 예시 <br/>
│   └── requirements.txt     # AI/ OCR용 파이썬 패키지 <br/>
│<br/>
├── backend/<br/>
│   ├── src/<br/>
│   │   ├── controllers/  # 요청 처리 로직 (추후 분리) <br/>
│   │   ├── routes/      # 라우터 모음 (추후 분리) <br/>
│   │   └── app.js     # Express 서버 진입점 (프로토타입용) <br/>
│   └── package.json    # 백엔드 의존성 정보 <br/>
│<br/>
├── frontend/    # 프론트엔드 (React 등, 추후 구현) <br/>
│
├── docs/ <br/>
│   ├── meeting_notes/   # 회의록 <br/>
│   └── api_spec.md      # 공통 API / JSON 규격 정의 <br/>
│<br/>
├── samples/<br/>
│   └── README.txt     # 샘플 계약서/테스트 데이터 안내<br/>
│<br/>
└── README.md       # 현재 문서<br/>

## 설치 및 실행 방법
### 1. 프로젝트 클론
```
git clone https://github.com/cloe-23/AI_LawDoctor.git
cd AI_LawDoctor
```
### 2. AI 파트 실행 (Python)
```
cd AI
pip install -r requirements.txt
python analysis/ai_example.py
```
### 3. 백엔드 실행 (Node.js)
```
cd backend
npm install
npm start
```
### 4. 프론트엔드 실행 (React + Vite)
```
cd frontend
npm install
npm run dev
```

##  개발자 코드 작성 가이드

이 프로젝트는 여러 파트(프론트엔드, 백엔드, AI 분석 등)의 팀원들이 함께 개발합니다.  
코드 스타일, 폴더 구조, API 응답 형식 등을 통일하기 위한 가이드라인은 아래 문서를 참고해 주세요.

👉 [개발자 코드 작성 가이드라인 보기](docs/dev_guide.md)

