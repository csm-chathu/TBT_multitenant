declare module "*.png";
declare module "*.svg";
declare module "*.jpeg";
declare module "*.jpg";

/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string;
  readonly VITE_SIGNED_URL_ENDPOINT?: string;
  readonly VITE_TICKET_TYPES?: string;
  readonly VITE_RC_CLIENT_ID?: string;
  readonly VITE_RC_SERVER?: string;
  readonly DEV: boolean;
  readonly PROD: boolean;
  readonly MODE: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}