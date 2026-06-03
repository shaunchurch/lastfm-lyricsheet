import { BrowserWindow, screen } from "electron";
import { join } from "node:path";
import type { Settings, WindowMode } from "@/shared/types";
import { compactWindowSize, expandedWindowSize } from "./settings";
import { getAnchoredWindowBounds } from "./window-bounds";

export function createMainWindow(settings: Settings): BrowserWindow {
  const size = getWindowSize(settings.windowMode);
  const bounds = settings.windowBounds;

  const window = new BrowserWindow({
    width: size.width,
    height: size.height,
    x: bounds?.x,
    y: bounds?.y,
    minWidth: 320,
    minHeight: 70,
    show: false,
    frame: false,
    transparent: process.platform === "darwin",
    vibrancy: process.platform === "darwin" ? "under-window" : undefined,
    visualEffectState: process.platform === "darwin" ? "active" : undefined,
    backgroundColor: process.platform === "darwin" ? "#00000000" : "#111111",
    title: "LyricSheet",
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: join(__dirname, "preload.js"),
      scrollBounce: true,
    },
  });

  window.setAlwaysOnTop(settings.alwaysOnTop, "floating");
  window.webContents.on("render-process-gone", (_event, details) => {
    console.error("Renderer process gone", details);
  });
  window.webContents.on("did-fail-load", (_event, code, description, url) => {
    console.error("Renderer failed to load", { code, description, url });
  });
  window.once("ready-to-show", () => window.show());

  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    void window.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    void window.loadFile(
      join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`),
    );
  }

  return window;
}

export function getWindowSize(mode: WindowMode): { width: number; height: number } {
  return mode === "compact" ? compactWindowSize : expandedWindowSize;
}

export function applyWindowMode(window: BrowserWindow, mode: WindowMode): void {
  const bounds = window.getBounds();
  const size = getWindowSize(mode);
  const display = screen.getDisplayMatching(bounds);
  window.setBounds(
    getAnchoredWindowBounds(bounds, size, display.workArea),
    process.platform === "darwin",
  );
}
