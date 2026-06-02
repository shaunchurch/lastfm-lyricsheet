import { useEffect, useState } from "react";
import type { AppState, Settings, WindowMode } from "@/shared/types";
import { LyricsView } from "./components/LyricsView";
import { SettingsView } from "./components/SettingsView";
import { TrackCard } from "./components/TrackCard";
import { WindowControls } from "./components/WindowControls";

type View = "player" | "settings";

export function App() {
  const [state, setState] = useState<AppState | null>(null);
  const [view, setView] = useState<View>("player");

  useEffect(() => {
    let cancelled = false;

    void window.lyricsheet.getState().then((nextState) => {
      if (cancelled) return;
      setState(nextState);
      if (!nextState.configured) {
        setView("settings");
        if (nextState.windowMode !== "expanded") {
          void window.lyricsheet.setWindowMode("expanded");
        }
      }
    });

    const unsubscribe = window.lyricsheet.onStateChanged((nextState) => {
      setState(nextState);
      if (!nextState.configured) {
        setView("settings");
        if (nextState.windowMode !== "expanded") {
          void window.lyricsheet.setWindowMode("expanded");
        }
      }
    });

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, []);

  async function saveSettings(settings: Partial<Settings>) {
    const nextState = await window.lyricsheet.saveSettings(settings);
    setState(nextState);
  }

  async function setWindowMode(mode: WindowMode) {
    const nextState = await window.lyricsheet.setWindowMode(mode);
    setState(nextState);
  }

  async function setAlwaysOnTop(alwaysOnTop: boolean) {
    const nextState = await window.lyricsheet.setAlwaysOnTop(alwaysOnTop);
    setState(nextState);
  }

  async function retryLyrics() {
    const nextState = await window.lyricsheet.retryLyrics();
    setState(nextState);
  }

  function openSettings() {
    setView("settings");
    if (state?.windowMode !== "expanded") {
      void setWindowMode("expanded");
    }
  }

  if (!state) {
    return (
      <div className="flex h-screen items-center justify-center text-sm text-white/58">
        Loading
      </div>
    );
  }

  if (view === "settings") {
    return (
      <SettingsView
        settings={state.settings}
        onSave={saveSettings}
        onBack={() => setView("player")}
      />
    );
  }

  const nextMode = state.windowMode === "compact" ? "expanded" : "compact";

  return (
    <main className="app-drag lyric-panel relative flex h-screen overflow-hidden text-white">
      <WindowControls
        mode={state.windowMode}
        pinned={state.alwaysOnTop}
        onToggleMode={() => void setWindowMode(nextMode)}
        onTogglePinned={() => void setAlwaysOnTop(!state.alwaysOnTop)}
        onRetry={() => void retryLyrics()}
        onSettings={openSettings}
        showRetry={Boolean(state.track)}
      />
      <div className="relative z-10 flex h-full w-full flex-col overflow-hidden">
        <TrackCard
          track={state.track}
          mode={state.windowMode}
          onExpand={() => void setWindowMode("expanded")}
        />
        {state.windowMode === "expanded" && (
          <LyricsView
            track={state.track}
            lyrics={state.lyrics}
            onRetry={() => void retryLyrics()}
            onOpenSource={(url) => void window.lyricsheet.openExternal(url)}
          />
        )}
      </div>
    </main>
  );
}
