import type { AppState, Settings, WindowMode } from "./types";

export const ipcChannels = {
  getState: "app:get-state",
  stateChanged: "app:state-changed",
  saveSettings: "settings:save",
  retryLyrics: "lyrics:retry",
  setWindowMode: "window:set-mode",
  setAlwaysOnTop: "window:set-always-on-top",
  openExternal: "shell:open-external",
} as const;

export interface LyricsheetApi {
  getState(): Promise<AppState>;
  saveSettings(settings: Partial<Settings>): Promise<AppState>;
  retryLyrics(): Promise<AppState>;
  setWindowMode(mode: WindowMode): Promise<AppState>;
  setAlwaysOnTop(alwaysOnTop: boolean): Promise<AppState>;
  openExternal(url: string): Promise<void>;
  onStateChanged(callback: (state: AppState) => void): () => void;
}
