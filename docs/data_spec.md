# AI LawDoctor - 데이터 구조 통합 명세서

> 타입/필드명 불일치 방지를 위한 공통 명세.
> 새 필드 추가 또는 변경 시 반드시 이 문서를 먼저 업데이트하고 각 레이어에 반영할 것.

---

## 서비스 흐름

```
Frontend (React)
    ↓ fetch (VITE_API_BASE_URL)
Backend (Express :3001)
    ↓ axios (AI_SERVER_URL)
AI Server (FastAPI :8000)
    ↓ Gemini API
```

---

## 1. 파일 업로드

### Frontend → Backend
```
POST /api/upload
Body: FormData { file }
```

### Backend 응답
```json
{
  "document_id": "string",
  "status": "uploaded"
}
```

### Frontend 타입 (api.ts: UploadResponse)
| 필드 | 타입 | 설명 |
|------|------|------|
| document_id | string | 업로드 문서 고유 ID |
| status | string | 상태값 |
| content | string (optional) | 파일 텍스트 내용 |

### Backend DB 스키마 (upload_db.js)
| 필드 | 타입 | 필수 |
|------|------|------|
| documentId | String | ✅ |

---

## 2. AI 분석 결과

### Backend → Frontend
```
GET /api/result/:documentId
```

### 응답 상태값
| status | 의미 |
|--------|------|
| processing | 분석 진행 중 (3초 후 재시도) |
| completed | 분석 완료 |
| failed | 분석 실패 |

---

## 3. 핵심 데이터 구조

### 3-1. AI 응답 최상위 구조

> **AI(ai_example.py)**, **Backend DB(result_db.js)**, **Frontend(api.ts: AnalysisResponse)** 모두 동일하게 유지

```json
{
  "summary": "string",
  "riskItems": [ RiskItem ],
  "forms": [ FormItem ]
}
```

| 필드 | 타입 | 설명 |
|------|------|------|
| summary | string | 계약서 전체 요약 (500자 이상) |
| riskItems | RiskItem[] | 위험 조항 목록 |
| forms | FormItem[] | 추천 법률 서식 목록 |

---

### 3-2. RiskItem (위험 조항)

> ⚠️ AI 프롬프트 수정 시 이 구조에 맞게 반영할 것

| 필드 | 타입 | 설명 | AI | Backend | Frontend |
|------|------|------|----|---------|----------|
| clauseText | string | 원문 조항 (최대 200자) | ✅ | ✅ | ✅ |
| riskLevel | "high" \| "medium" \| "low" | 위험 등급 | ✅ | ✅ | ✅ |
| reason | string | 위험한 이유 | ✅ | ✅ | ✅ |
| checkPoints | string[] | 체크포인트 목록 | ✅ (수정 예정) | ✅ | ✅ |
| improvedClause | string | 실제 수정 제안 문구 | ✅ (수정 예정) | ✅ | ✅ |

```json
{
  "clauseText": "원문 조항 일부 (최대 200자)",
  "riskLevel": "high",
  "reason": "위험한 이유 설명",
  "checkPoints": ["확인사항 1", "확인사항 2"],
  "improvedClause": "이렇게 수정하세요: ..."
}
```

---

### 3-3. FormItem (추천 서식)

| 필드 | 타입 | 설명 |
|------|------|------|
| type | string | 서식 종류 |
| description | string | 서식 설명 |
| downloadUrl | string | 다운로드 링크 |

---

### 3-4. ImprovementGuide (대응 가이드 탭용)

> Frontend GuideView 전용 구조. RiskItem에서 변환하여 사용.

| 필드 | 타입 | 설명 | RiskItem 매핑 |
|------|------|------|--------------|
| id | number | 순서 번호 | - |
| page | number (optional) | 문서 페이지 | - |
| originalClause | string | 원문 조항 | ← clauseText |
| checkPoints | string[] | 체크포인트 | ← checkPoints |
| improvedClause | string | 수정 제안 문구 | ← improvedClause |

---

### 3-5. ContractTip (계약서 팁)

| 필드 | 타입 | 설명 |
|------|------|------|
| docType | string | 계약서 종류 |
| title | string | 팁 제목 |
| items | string[] | 팁 목록 |

---

## 4. 환경변수 목록

### Backend (.env)
| 키 | 설명 |
|----|------|
| MONGO_URL | MongoDB Atlas 연결 문자열 |
| JWT_SECRET | JWT 서명 키 |
| COOKIE_SECRET | 쿠키 암호화 키 |
| NODE_ENV | 실행 환경 (development / production) |
| PORT | 서버 포트 (기본 3001) |
| AI_SERVER_URL | AI 서버 주소 (기본 http://localhost:8000) |

### AI (.env)
| 키 | 설명 |
|----|------|
| GEMINI_API_KEY | Google Gemini API 키 |

### Frontend (.env)
| 키 | 설명 |
|----|------|
| VITE_API_BASE_URL | 백엔드 API 주소 (기본 http://localhost:3001/api) |

---

## 5. 수정 이력

| 날짜 | 변경 내용 |
|------|----------|
| 2026-03-06 | 최초 작성. RiskItem의 `guide(string)` → `checkPoints(string[])` + `improvedClause(string)` 분리 |
