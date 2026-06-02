import type { LyricsheetApi } from "@/shared/ipc";
import type { AppState, Settings, WindowMode } from "@/shared/types";

const sampleSettings: Settings = {
  lastfmApiKey: "dev-lastfm-key",
  lastfmUsername: "lastfm-user",
  geniusAccessToken: "dev-genius-token",
  alwaysOnTop: true,
  windowMode: "expanded",
  pollIntervalSeconds: 10,
};

let sampleState: AppState = {
  configured: true,
  settings: sampleSettings,
  track: {
    id: "dev-track",
    name: "Modern Age",
    artist: "The Strokes",
    album: "Is This It",
    artworkUrl:
      "https://lastfm.freetls.fastly.net/i/u/300x300/31311c6d75ca4e14b3fcfa0b34fe5e41.jpg",
    lastfmUrl: "https://www.last.fm/music/The+Strokes/_/The+Modern+Age",
    nowPlaying: true,
  },
  lyrics: {
    status: "ready",
    html: [
      "The monitor hums while the record spins",
      "<br>",
      "A small bright card keeps time in the corner",
      "<br><br>",
      "Words drift in quietly, line after line",
      "<br>",
      "Enough to follow without breaking the day",
    ].join(""),
    providerName: "Genius",
    sourceUrl: "https://genius.com/",
    cached: false,
  },
  providerStatus: {
    nowPlaying: "listening",
    lyrics: "idle",
  },
  windowMode: "expanded",
  alwaysOnTop: true,
};

const listeners = new Set<(state: AppState) => void>();

export function installMockApi(): void {
  if (window.lyricsheet || !import.meta.env.DEV) return;

  const api: LyricsheetApi = {
    getState: async () => sampleState,
    saveSettings: async (settings: Partial<Settings>) => {
      sampleState = {
        ...sampleState,
        configured: true,
        settings: {
          ...sampleState.settings,
          ...settings,
        },
      };
      emitState();
      return sampleState;
    },
    retryLyrics: async () => {
      emitState();
      return sampleState;
    },
    setWindowMode: async (mode: WindowMode) => {
      sampleState = {
        ...sampleState,
        settings: {
          ...sampleState.settings,
          windowMode: mode,
        },
        windowMode: mode,
      };
      emitState();
      return sampleState;
    },
    setAlwaysOnTop: async (alwaysOnTop: boolean) => {
      sampleState = {
        ...sampleState,
        settings: {
          ...sampleState.settings,
          alwaysOnTop,
        },
        alwaysOnTop,
      };
      emitState();
      return sampleState;
    },
    openExternal: async () => {},
    onStateChanged: (callback: (state: AppState) => void) => {
      listeners.add(callback);
      return () => listeners.delete(callback);
    },
  };

  window.lyricsheet = api;
}

function emitState(): void {
  for (const listener of listeners) {
    listener(sampleState);
  }
}
