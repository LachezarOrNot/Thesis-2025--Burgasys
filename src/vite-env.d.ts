
interface ImportMetaEnv {
  readonly VITE_FIREBASE_API_KEY: string
  readonly VITE_FIREBASE_AUTH_DOMAIN: string
  readonly VITE_FIREBASE_PROJECT_ID: string
  readonly VITE_FIREBASE_STORAGE_BUCKET: string
  readonly VITE_FIREBASE_MESSAGING_SENDER_ID: string
  readonly VITE_FIREBASE_APP_ID: string
  readonly VITE_GOOGLE_MAPS_API_KEY?: string
  readonly VITE_BACKEND_URL?: string
  readonly VITE_AGORA_APP_ID: string;
  readonly VITE_AGORA_TEMP_TOKEN?: string;
  readonly VITE_AGORA_APP_CERTIFICATE?: string;
  readonly VITE_DAILY_API_KEY?: string;
  readonly VITE_DAILY_DOMAIN?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}