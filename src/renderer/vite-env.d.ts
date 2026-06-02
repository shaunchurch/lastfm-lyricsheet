/// <reference types="vite/client" />

import type { LyricsheetApi } from "@/shared/ipc";

declare global {
  interface Window {
    lyricsheet: LyricsheetApi;
  }
}
