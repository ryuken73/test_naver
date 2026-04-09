/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** 백엔드 API 베이스 URL (프로덕션). 예: https://api.example.com */
  readonly VITE_API_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
