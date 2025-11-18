# Frontend (React + Vite)

본 폴더는 AI_LawDoctor의 프론트엔드 코드를 업로드하는 공간입니다.  
계약서 업로드 화면, 분석 결과 UI, 마이페이지, 커뮤니티 등이 여기에 개발됩니다.

## 설치 방법
1. Node.js 18+ 설치
2. 패키지 설치
```
npm install

```
3. 개발 서버 실행
```
npm run dev
```
브라우저에서:
👉 http://localhost:5173

## 개발 규칙
### 코드 스타일
- 컴포넌트명: PascalCase
- 파일명: ComponentName.jsx
- API 호출은 services/ 또는 api/ 폴더로 분리
- CSS는 styled-components 또는 기본 CSS 중 팀에서 결정한 방식 사용
### 폴더 규칙(예정)
src/ </br>
├── pages/           # 페이지 단위 컴포넌트 </br>
├── components/      # 재사용 UI </br>
├── hooks/           # 커스텀 훅 </br>
├── api/             # axios 기반 API 요청 </br>
└── assets/          # 이미지 / 아이콘 </br>

## 역할
- 사용자 입력(계약서 텍스트 또는 파일)
- 백엔드 /api/analyze-text 호출
- 분석 결과를 시각적으로 표현 (조항 하이라이팅, 위험도 표시)
- 마이페이지, 커뮤니티 등 UI 구현 예정

## 향후 계획
- Recoil 또는 Zustand로 상태관리 적용
- 분석 결과 JSON UI 렌더링 컴포넌트 추가
- 업로드 → 분석 → 결과 페이지 전체 흐름 완성
