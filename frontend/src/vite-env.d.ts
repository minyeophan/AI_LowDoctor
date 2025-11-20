/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string;
  // 다른 환경 변수를 추가하려면 여기에 정의
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
