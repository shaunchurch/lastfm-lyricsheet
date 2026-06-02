import { app, BrowserWindow, ipcMain, shell } from "electron";
import started from "electron-squirrel-startup";
import { join } from "node:path";
import { ipcChannels } from "@/shared/ipc";
import type { AppState, Settings, Track, WindowMode } from "@/shared/types";
import { findLyrics } from "./lyrics-service";
import { LastFmRecentTracksProvider } from "./providers/now-playing/lastfm";
import { defaultSettings, isConfigured, normalizeSettings } from "./settings";
import { loadSettings, saveSettings } from "./store";
import { applyWindowMode, createMainWindow } from "./window";

if (started) {
  app.quit();
}

configureApplicationPaths();

let mainWindow: BrowserWindow | undefined;
let settings = defaultSettings;
let lyricRequestId = 0;

const nowPlayingProvider = new LastFmRecentTracksProvider();

const state: AppState = {
  configured: isConfigured(settings),
  settings,
  lyrics: {
    status: "idle",
    html: "",
  },
  providerStatus: {
    nowPlaying: "idle",
    lyrics: "idle",
  },
  windowMode: settings.windowMode,
  alwaysOnTop: settings.alwaysOnTop,
};

app.on("ready", () => {
  settings = loadSettings();
  if (!isConfigured(settings)) {
    settings = normalizeSettings({
      ...settings,
      windowMode: "expanded",
    });
  }
  state.settings = settings;
  state.configured = isConfigured(settings);
  state.windowMode = settings.windowMode;
  state.alwaysOnTop = settings.alwaysOnTop;
  mainWindow = createMainWindow(settings);
  bindWindowPersistence(mainWindow);
  bindIpc();
  startProviders();
  publishState();
});

app.on("window-all-closed", () => {
  nowPlayingProvider.stop();
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    mainWindow = createMainWindow(settings);
    bindWindowPersistence(mainWindow);
    publishState();
  }
});

function bindIpc(): void {
  ipcMain.handle(ipcChannels.getState, () => getPublicState());

  ipcMain.handle(ipcChannels.saveSettings, (_event, nextSettings: Partial<Settings>) => {
    settings = normalizeSettings({
      ...settings,
      ...nextSettings,
    });
    saveSettings(settings);
    state.settings = settings;
    state.configured = isConfigured(settings);
    state.alwaysOnTop = settings.alwaysOnTop;
    state.windowMode = settings.windowMode;
    mainWindow?.setAlwaysOnTop(settings.alwaysOnTop, "floating");
    startProviders();
    publishState();
    return getPublicState();
  });

  ipcMain.handle(ipcChannels.retryLyrics, async () => {
    if (state.track) {
      await lookupLyrics(state.track, { bypassCache: true });
    }
    return getPublicState();
  });

  ipcMain.handle(ipcChannels.setWindowMode, (_event, mode: WindowMode) => {
    settings = normalizeSettings({
      ...settings,
      windowMode: mode,
      windowBounds: mainWindow?.getBounds() || settings.windowBounds,
    });
    state.windowMode = mode;
    state.settings = settings;
    applyWindowModeIfReady(mode);
    saveSettings({
      ...settings,
      windowBounds: mainWindow?.getBounds() || settings.windowBounds,
    });
    publishState();
    return getPublicState();
  });

  ipcMain.handle(ipcChannels.setAlwaysOnTop, (_event, alwaysOnTop: boolean) => {
    settings = normalizeSettings({
      ...settings,
      alwaysOnTop,
    });
    saveSettings(settings);
    state.alwaysOnTop = alwaysOnTop;
    state.settings = settings;
    mainWindow?.setAlwaysOnTop(alwaysOnTop, "floating");
    publishState();
    return getPublicState();
  });

  ipcMain.handle(ipcChannels.openExternal, async (_event, url: string) => {
    if (!/^https?:\/\//i.test(url)) return;
    await shell.openExternal(url);
  });
}

function configureApplicationPaths(): void {
  app.setName("LyricSheet");
  app.setAppUserModelId("com.lyricsheet.app");

  if (MAIN_WINDOW_VITE_DEV_SERVER_URL || process.env.CODEX_CI) {
    app.setPath("userData", join(process.cwd(), ".cache", "user-data"));
  }
}

function startProviders(): void {
  nowPlayingProvider.stop();

  if (!isConfigured(settings)) {
    state.configured = false;
    state.providerStatus.nowPlaying = "idle";
    state.providerStatus.lyrics = "idle";
    publishState();
    return;
  }

  state.configured = true;
  nowPlayingProvider.start(settings, {
    onTrack: (track) => void handleTrack(track),
    onError: (error) => {
      state.providerStatus.error = error;
      publishState();
    },
    onStatus: (status) => {
      state.providerStatus.nowPlaying = status;
      publishState();
    },
  });
}

async function handleTrack(track: Track): Promise<void> {
  state.track = track;
  await lookupLyrics(track);
}

async function lookupLyrics(
  track: Track,
  options: { bypassCache?: boolean } = {},
): Promise<void> {
  const requestId = ++lyricRequestId;
  state.lyrics = {
    status: "loading",
    html: "",
  };
  state.providerStatus.lyrics = "searching";
  publishState();

  try {
    const result = await findLyrics(track, settings, options);
    if (requestId !== lyricRequestId) return;
    state.lyrics = {
      status: "ready",
      html: result.html,
      providerName: result.providerName,
      sourceUrl: result.sourceUrl,
      cached: result.cached,
    };
    state.providerStatus.lyrics = "idle";
    state.providerStatus.error = undefined;
  } catch (error) {
    if (requestId !== lyricRequestId) return;
    const message = error instanceof Error ? error.message : "Lyrics not found";
    state.lyrics = {
      status: message === "Lyrics not found" ? "not-found" : "error",
      html: "",
      error: message,
    };
    state.providerStatus.lyrics = "error";
    state.providerStatus.error = message;
  }

  publishState();
}

function applyWindowModeIfReady(mode: WindowMode): void {
  if (!mainWindow) return;
  applyWindowMode(mainWindow, mode);
}

function bindWindowPersistence(window: BrowserWindow): void {
  let saveTimer: NodeJS.Timeout | undefined;
  const persistBounds = () => {
    if (saveTimer) clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      settings = normalizeSettings({
        ...settings,
        windowBounds: window.getBounds(),
      });
      state.settings = settings;
      saveSettings(settings);
    }, 250);
  };

  window.on("move", persistBounds);
  window.on("resize", persistBounds);
}

function publishState(): void {
  mainWindow?.webContents.send(ipcChannels.stateChanged, getPublicState());
}

function getPublicState(): AppState {
  return {
    ...state,
    settings,
    configured: isConfigured(settings),
    windowMode: settings.windowMode,
    alwaysOnTop: settings.alwaysOnTop,
  };
}
