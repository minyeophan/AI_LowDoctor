#  Backend (Express 서버)

본 폴더는 AI_LawDoctor 프로젝트의 **API 서버(Express)** 를 담당합니다.  
문서 분석 요청, 사용자 요청 처리, 프론트와의 통신 등을 구현하는 영역입니다.

## 설치 방법
1. Node.js 18+ 설치
2. 패키지 설치
```
npm install
```
3. 서버 실행
```
npm start
```

## 기본 API
### GET /
테스트용 기본 응답
```
{ "msg": "AI Legal Doctor Backend OK" }
```
### POST ```/api/analyze-text```
(추가 예정)
AI 폴더의 Python 분석기와 연동해 계약서 텍스트를 분석하여 JSON으로 반환하는 API.

## 개발 규칙
- routes/에서 엔드포인트 분리
- controllers/에서 HTTP 요청 처리
- services/에서 실제 로직 처리
- 미들웨어는 /src/middleware/ 폴더에 추가 (필요하면 생성)
### 코드 스타일
- 세미콜론 사용
- ES Module 방식 (import)
- const / let 명확히 구분

## 환경 변수 (예정)
추후 DB, JWT, 외부 API 연동 시 .env가 추가될 예정:
```
PORT=3001
MONGO_URL=...
JWT_SECRET=...
```

## 향후 계획
- AI 분석 Python 서버와 직접 통신 (HTTP 또는 subprocess)
- JWT 기반 인증
- DB 연결 (MongoDB 또는 PostgreSQL)
- 캘린더 API 연동
