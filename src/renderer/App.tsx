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
      <main className="lyric-panel relative flex h-screen overflow-hidden text-white">
        <LoadingShell />
      </main>
    );
  }

  if (view === "settings") {
    return (
      <SettingsView
        canGoBack={state.configured}
        settings={state.settings}
        onSave={saveSettings}
        onBack={() => setView("player")}
      />
    );
  }

  return (
    <main className="lyric-panel relative flex h-screen overflow-hidden text-white">
      <ArtworkBackdrop artworkUrl={state.track?.artworkUrl} />
      {state.windowMode === "expanded" && (
        <div
          className="app-drag absolute left-0 top-0 z-20 h-[72px] w-[calc(100%-152px)]"
          aria-hidden="true"
        />
      )}
      {state.windowMode === "compact" && (
        <>
          <div
            className="app-drag absolute bottom-0 left-0 top-0 z-20 w-[calc(100%-152px)]"
            aria-hidden="true"
          />
          <div
            className="app-drag absolute bottom-0 left-0 right-0 z-20 h-5"
            aria-hidden="true"
          />
        </>
      )}
      <WindowControls
        mode={state.windowMode}
        pinned={state.alwaysOnTop}
        onSetMode={(mode) => void setWindowMode(mode)}
        onTogglePinned={() => void setAlwaysOnTop(!state.alwaysOnTop)}
        onRetry={() => void retryLyrics()}
        onSettings={openSettings}
        showRetry={canRetryLyrics(state)}
      />
      <div className="relative z-10 flex h-full w-full flex-col overflow-hidden">
        <TrackCard
          track={state.track}
          mode={state.windowMode}
          subtitle={getTrackSubtitle(state)}
        />
        {state.windowMode === "expanded" && (
          <LyricsView
            track={state.track}
            lyrics={state.lyrics}
            providerStatus={state.providerStatus}
            onRetry={() => void retryLyrics()}
            onOpenSource={(url) => void window.lyricsheet.openExternal(url)}
          />
        )}
      </div>
    </main>
  );
}

function canRetryLyrics(state: AppState): boolean {
  return Boolean(
    state.track &&
      (state.lyrics.status === "error" || state.lyrics.status === "not-found"),
  );
}

function getTrackSubtitle(state: AppState): string {
  if (!state.track) {
    if (state.providerStatus.nowPlaying === "error") {
      return state.providerStatus.error || "Last.fm unavailable";
    }
    if (state.providerStatus.nowPlaying === "connecting") {
      return "Connecting to Last.fm";
    }
    return "Waiting for Last.fm";
  }

  if (state.lyrics.status === "loading") {
    return "Looking up lyrics";
  }

  if (state.lyrics.status === "not-found") {
    return "Lyrics not found";
  }

  if (state.lyrics.status === "error") {
    return "Lyrics unavailable";
  }

  return [state.track.artist, state.track.album].filter(Boolean).join(" · ");
}

function ArtworkBackdrop({ artworkUrl }: { artworkUrl?: string }) {
  return (
    <>
      {artworkUrl && (
        <div
          className="artwork-backdrop"
          style={{ backgroundImage: `url("${artworkUrl}")` }}
        />
      )}
      <div className="panel-readable-overlay" />
    </>
  );
}

function LoadingShell() {
  return (
    <div className="app-drag relative z-10 flex h-full w-full flex-col overflow-hidden">
      <div className="flex items-center gap-[11px] px-[14px] py-3">
        <div className="skeleton-block h-11 w-11 rounded-[6px]" />
        <div className="grid flex-1 gap-2 pr-20">
          <div className="skeleton-block h-4 w-36 rounded-full" />
          <div className="skeleton-block h-3 w-44 rounded-full opacity-70" />
        </div>
      </div>
      <div className="grid gap-3 px-[18px] pt-[18px]">
        <div className="skeleton-block h-3 w-20 rounded-full opacity-60" />
        <div className="skeleton-block h-3 w-full rounded-full opacity-50" />
        <div className="skeleton-block h-3 w-11/12 rounded-full opacity-45" />
        <div className="skeleton-block h-3 w-4/5 rounded-full opacity-40" />
      </div>
    </div>
  );
}
