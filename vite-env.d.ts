/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_TIKTOK_CLIENT_KEY: string
  readonly VITE_FACEBOOK_APP_ID: string
  readonly VITE_INSTAGRAM_APP_ID: string
  // more env variables...
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
