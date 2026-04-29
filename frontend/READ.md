# Frontend (React + Vite + TypeScript)

계약서 업로드, 분석 결과 시각화 등 사용자 인터페이스를 담당합니다.

---

## 폴더 구성

```
frontend/src/
├── pages/          # 페이지 단위 컴포넌트 (AiPage, HomePage 등)
├── components/     # 재사용 UI 컴포넌트
├── api/            # API 요청 모듈 (documents.ts, analyze.ts)
├── context/        # React Context (AuthContext, DocumentContext)
├── mock/           # 목업 데이터 (백엔드 없이 UI 확인용)
├── types/          # TypeScript 타입 정의
└── styles/         # 전역 스타일
```

---

## 환경 변수 설정

`frontend/.env` 파일:
```
VITE_API_BASE_URL=http://localhost:3001/api
VITE_API_URL=http://localhost:3001
```

- `VITE_API_BASE_URL`: 이 값이 있을 때만 실제 백엔드 API 호출 (없으면 목업 데이터 사용)
- `VITE_API_URL`: 실제 API 요청 base URL

---

## 실행 방법

### Docker (권장)
루트에서 `docker-compose up --build` 실행 시 자동 실행됨 (포트 80)

### 직접 실행 (개발)
```bash
cd frontend
npm install
npm run dev
```
브라우저: http://localhost:5173

---

## 개발 규칙

- 컴포넌트명: PascalCase
- 파일명: ComponentName.tsx
- API 호출은 `src/api/` 폴더에서 관리
- CSS는 컴포넌트별 `.css` 파일 사용
