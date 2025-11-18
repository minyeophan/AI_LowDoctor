# AI_LAWDOCTOR 코드 작성 가이드라인

> 이 문서는 AI_LAWDOCTOR 프로젝트의 팀원들이 코드를 작성할 때 규칙과 구조를 통일하기 위해 작성되었습니다.  
> 목적은 협업 시 일관성 유지, 유지보수 편의성 확보, 커뮤니케이션 효율화입니다.

---

## 1. 폴더/디렉토리 구조 규칙

### 루트 구조
AI_LAWDOCTOR/  </br>
├── AI/         # AI 분석, OCR 관련 Python 코드 </br>
├── backend/     # Node.js 기반 API 서버</br>
├── frontend/    # React 기반 프론트엔드 (CRA 또는 Vite)</br>
├── docs/        # 회의록, 명세서, API 문서 등</br>
├── samples/     # 샘플 계약서, 테스트 데이터 등</br>
└── README.md    # 프로젝트 개요 및 실행 방법</br>


### 백엔드 내부 (`backend/src`)
src/</br>
├── app.js        # 서버 진입점</br>
├── controllers/  # 요청 처리 로직</br>
├── routes/       # 엔드포인트 선언</br>
├── services/     # 비즈니스 로직 처리</br>


---

## 2. API 통신 규칙 (백엔드 ↔ 프론트, 백엔드 ↔ AI)

### 성공 응답
```json
{
  "status": "success",
  "message": "분석 완료",
  "data": {
     실제 데이터 객체
  }
}
```
#에러 응답
```json
{
  "status": "error",
  "message": "필수 입력 누락",
  "code": 400
}
```
## 3. 네이밍 규칙
| 항목    | 규칙 예시                                       |
| ----- | ------------------------------------------- |
| 파일명   | `snake_case` (`ai_example.py`)              |
| 폴더명   | `snake_case`                                |
| 함수명   | JS → `camelCase`, Python → `snake_case`     |
| 변수명   | JS → `camelCase`, Python → `snake_case`     |
| 클래스명  | `PascalCase`                                |
| 컴포넌트명 | React → `PascalCase` (`ContractViewer.jsx`) |

## 4. 테스트 데이터

/samples/ 폴더에 저장

예: sample_contract_01.txt, test_response_01.json

사용한 샘플 설명은 README.txt에 추가


## 5. AI 파트 작성 규칙 (Python)

분석 함수는 다음 형식으로 유지:
def analyze_contract(text: str) -> dict:
    """
    계약서 텍스트를 받아 위험 조항을 분석합니다.
    """
- OCR 관련 코드는 AI/ocr/ 아래에 분리
- requirements.txt는 패키지 추가 시 항상 업데이트

## 6. 코드 스타일 통일
#JavaScript (Node.js)
- 세미콜론 사용 (통일)
- const, let 구분
- ESLint 사용 권장 (추후 .eslintrc.json 도입)

#Python
- Black 또는 autopep8 사용 가능
- 함수/클래스에 docstring 작성

## 7. 문서 작성 규칙
- Markdown .md 형식
- 제목은 #, 리스트는 - 또는 *
- docs/ 안에 저장
- 예: api_spec.md, meeting_2025_11_19.md

## 8. Git 협업 규칙
- 브랜치 명명: feature/기능, fix/버그, docs/문서 등
git checkout -b feature/ai-analysis
- 커밋 메시지 컨벤션:
feat: 계약서 분석 로직 초안 추가
fix: API 경로 에러 수정
docs: 회의록 추가
-PR 전에 작업 설명을 README.txt 또는 PR 템플릿에 요약

## 분석 결과 JSON 예시 (프론트 ↔ 백엔드)
```json
{
  "documentId": "sample-001",
  "summary": "계약기간, 자동갱신, 위약금 조항이 포함된 전세 계약입니다.",
  "riskItems": [
    {
      "id": 1,
      "clauseText": "본 계약은 별도 해지 통보가 없을 시 자동 갱신된다.",
      "riskLevel": "high",
      "reason": "해지 통보 기한이 명시되지 않아 임차인에게 불리할 수 있음.",
      "lawRefs": [
        {
          "name": "주택임대차보호법",
          "article": "제6조의3",
          "url": "https://www.law.go.kr/..."
        }
      ],
      "guide": "계약서에 '자동 갱신을 원하지 않을 경우 ○개월 전에 통보' 문구를 명시하는 것이 안전합니다."
    }
  ],
  "forms": [
    {
      "type": "계약 해지 통보서",
      "description": "전세 계약 해지를 통보할 때 사용하는 기본 양식",
      "downloadUrl": "https://example.com/forms/termination.hwp"
    }
  ]
}
```

✅ 본 문서는 지속적으로 업데이트됩니다.
팀원 누구든 개선 사항이 있으면 회의 후 반영 바랍니다.
