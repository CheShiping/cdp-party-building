/// <reference types="vite/client" />
/// <reference types="@dcloudio/types" />

interface ImportMetaEnv {
  readonly VITE_PROJECT_NAME: string;
  readonly VITE_BASE_URL: string;
  readonly VITE_H5_BASE_URL: string;
  readonly VITE_APP_BASE_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
