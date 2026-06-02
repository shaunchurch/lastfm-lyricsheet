import { contextBridge, ipcRenderer } from "electron";
import { ipcChannels, type LyricsheetApi } from "@/shared/ipc";
import type { AppState, Settings, WindowMode } from "@/shared/types";

const api: LyricsheetApi = {
  getState: () => ipcRenderer.invoke(ipcChannels.getState) as Promise<AppState>,
  saveSettings: (settings: Partial<Settings>) =>
    ipcRenderer.invoke(ipcChannels.saveSettings, settings) as Promise<AppState>,
  retryLyrics: () => ipcRenderer.invoke(ipcChannels.retryLyrics) as Promise<AppState>,
  setWindowMode: (mode: WindowMode) =>
    ipcRenderer.invoke(ipcChannels.setWindowMode, mode) as Promise<AppState>,
  setAlwaysOnTop: (alwaysOnTop: boolean) =>
    ipcRenderer.invoke(ipcChannels.setAlwaysOnTop, alwaysOnTop) as Promise<AppState>,
  openExternal: (url: string) =>
    ipcRenderer.invoke(ipcChannels.openExternal, url) as Promise<void>,
  onStateChanged: (callback: (state: AppState) => void) => {
    const listener = (_event: Electron.IpcRendererEvent, state: AppState) => {
      callback(state);
    };
    ipcRenderer.on(ipcChannels.stateChanged, listener);
    return () => ipcRenderer.off(ipcChannels.stateChanged, listener);
  },
};

contextBridge.exposeInMainWorld("lyricsheet", api);
