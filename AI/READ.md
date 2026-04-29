# AI 파트 안내 (AI_LawDoctor)

계약서 OCR 및 위험 조항 분석을 처리하는 FastAPI 서버입니다.

---

## 폴더 구성

```
AI/
├── ai_api.py              # FastAPI 서버 진입점 (포트 8000)
├── analysis/
│   └── ai_example.py      # Gemini API 계약서 분석 모듈
├── ocr/
│   └── ocr_example.py     # PDF 텍스트 추출 모듈 (pdfplumber)
├── requirements.txt       # Python 패키지 목록
├── Dockerfile
└── .env                   # GEMINI_API_KEY 설정
```

---

## 환경 변수 설정

`AI/.env` 파일 생성:
```
GEMINI_API_KEY=your_gemini_api_key
```

---

## 실행 방법

### Docker (권장)
루트에서 `docker-compose up --build` 실행 시 자동 실행됨

### 직접 실행
```bash
cd AI
pip install -r requirements.txt
uvicorn ai_api:app --host 0.0.0.0 --port 8000
```

---

## API 엔드포인트

| 메서드 | 경로 | 설명 |
|--------|------|------|
| POST | `/api/ocr` | 파일 경로로 텍스트 추출 |
| POST | `/api/ai-analyze` | 텍스트 → 위험 조항 분석 |

---

## 주의사항

- PDF 파일만 OCR 지원 (pdfplumber 사용)
- Gemini API 호출 비용 발생 → 개발 시 최소 사용 권장
- `requirements.txt`에 패키지 추가 시 반드시 반영
