# AI 파트 코드 안내서 (AI_LawDoctor)

본 폴더는 계약서 위험 조항 분석과 OCR(이미지 → 텍스트)을 처리하는  
AI 기능 모듈을 포함하고 있습니다.

---

## 폴더 구성
AI/  </br>
├── analysis/ # 계약서 텍스트 → 위험 조항 분석 예시</br>
│ └── ai_example.py</br>
├── ocr/ # 이미지/문서 → 텍스트 추출 예시</br>
│ └── ocr_example.py</br>
├── requirements.txt # Python 패키지 목록</br>
└── README.md</br>

---

## 설치 방법

### Python 환경 구성

1. Python 3.8 이상 설치  
2. (선택) 가상환경 생성
```bash
python -m venv venv
source venv/bin/activate   # Mac/Linux
venv\Scripts\activate      # Windows
```
3. 패키지 설치
```
pip install -r requirements.txt
```

## 환경 변수 설정
OpenAI API를 사용하는 경우 .env 파일을 생성하고 아래처럼 입력:
```
OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxx
```
(※ .env는 .gitignore에 포함되어 있어야 함)

## 실행 방법
### 1. AI 분석 예시 실행
```
python analysis/ai_example.py
```
### 2. OCR 텍스트 추출 예시 실행
```
python ocr/ocr_example.py
```
## 주요 함수 형식
```
def analyze_contract(text: str) -> dict:
    """
    계약서 내용을 받아 위험 요소를 분석한 결과를 반환합니다.
    """
```
※ 이후 백엔드와 연동 시 JSON 구조로 확장될 예정

## 주의사항
- samples/ 폴더에 테스트 이미지를 넣어야 OCR 실행 가능
- OpenAI API 호출은 비용이 발생하므로 개발 단계에서는 최소 사용 권장
- requirements.txt에 패키지 추가 시 반드시 반영

## 향후 계획
- 분석 결과 JSON 스키마 통합
- 날짜/금액 정보 추출 로직 추가
- OCR + 분석 통합 함수 작성
