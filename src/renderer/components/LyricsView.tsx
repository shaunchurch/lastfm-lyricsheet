import { ExternalLink, RefreshCw } from "lucide-react";
import type { LyricsState, ProviderStatus, Track } from "@/shared/types";
import { Button } from "./ui/button";

interface LyricsViewProps {
  track?: Track;
  lyrics: LyricsState;
  providerStatus: ProviderStatus;
  onOpenSource(url: string): void;
  onRetry(): void;
}

export function LyricsView({
  track,
  lyrics,
  providerStatus,
  onOpenSource,
  onRetry,
}: LyricsViewProps) {
  if (!track) {
    if (providerStatus.nowPlaying === "error") {
      return (
        <StatePanel
          title="Last.fm unavailable"
          detail={providerStatus.error || "Unable to read your current track"}
        />
      );
    }

    return (
      <StatePanel
        title={
          providerStatus.nowPlaying === "connecting"
            ? "Connecting to Last.fm"
            : "Waiting for Last.fm"
        }
        detail={
          providerStatus.nowPlaying === "connecting"
            ? "Checking your recent tracks"
            : "Listening for your current track"
        }
      />
    );
  }

  if (lyrics.status === "loading") {
    return (
      <StatePanel
        title="Looking up lyrics"
        detail={`${track.artist} · ${track.name}`}
        loading
      />
    );
  }

  if (lyrics.status === "error" || lyrics.status === "not-found") {
    return (
      <StatePanel
        title={lyrics.status === "not-found" ? "Lyrics not found" : "Lyrics unavailable"}
        detail={lyrics.error || `${track.artist} · ${track.name}`}
        onRetry={onRetry}
      />
    );
  }

  if (!lyrics.html) {
    return (
      <StatePanel
        title="Waiting for lyrics"
        detail={`${track.artist} · ${track.name}`}
      />
    );
  }

  return (
    <section className="app-no-drag flex min-h-0 flex-1 flex-col overflow-hidden">
      <div
        className="lyrics-scroll min-h-0 flex-1 overflow-y-auto px-[18px] pb-0 pt-[18px] text-left text-[14px] font-normal leading-[21px] text-white/72"
        dangerouslySetInnerHTML={{ __html: lyrics.html }}
      />
      {lyrics.sourceUrl && (
        <div className="flex shrink-0 items-center justify-start px-[18px] pb-3 pt-2">
          <Button
            type="button"
            variant="ghost"
            size="default"
            className="h-auto min-w-0 justify-start px-0 text-left text-[12px] font-normal leading-[16.5px] text-white/40 hover:bg-transparent hover:text-white/62"
            onClick={() => lyrics.sourceUrl && onOpenSource(lyrics.sourceUrl)}
          >
            <ExternalLink size={12} className="shrink-0" />
            <span className="truncate">{formatSourceLabel(lyrics.sourceUrl)}</span>
          </Button>
        </div>
      )}
    </section>
  );
}

function formatSourceLabel(url: string): string {
  try {
    const parsed = new URL(url);
    return `${parsed.hostname.replace(/^www\./, "")}${parsed.pathname}`.replace(
      /\/$/,
      "",
    );
  } catch {
    return url;
  }
}

function StatePanel({
  title,
  detail,
  loading = false,
  onRetry,
}: {
  title: string;
  detail: string;
  loading?: boolean;
  onRetry?: () => void;
}) {
  return (
    <section className="app-no-drag flex min-h-0 flex-1 flex-col overflow-hidden px-[18px] pb-4 pt-[18px]">
      <div className="grid gap-2">
        <p className="text-[13px] font-semibold leading-5 text-white/74">{title}</p>
        <p className="truncate text-[12px] leading-[18px] text-white/42">{detail}</p>
      </div>
      <div className="mt-7 grid gap-3">
        <div className="skeleton-block h-3 w-11/12 rounded-full opacity-55" />
        <div className="skeleton-block h-3 w-full rounded-full opacity-45" />
        <div className="skeleton-block h-3 w-4/5 rounded-full opacity-40" />
        {loading && (
          <>
            <div className="skeleton-block h-3 w-10/12 rounded-full opacity-35" />
            <div className="skeleton-block h-3 w-8/12 rounded-full opacity-30" />
          </>
        )}
      </div>
      {onRetry && (
        <Button
          type="button"
          variant="subtle"
          className="mt-auto w-fit bg-white/8 text-white/72 hover:bg-white/12"
          onClick={onRetry}
        >
          <RefreshCw size={15} />
          Retry
        </Button>
      )}
    </section>
  );
}
