import type { Track, WindowMode } from "@/shared/types";
import { cn } from "../lib/utils";
import { Artwork } from "./Artwork";

interface TrackCardProps {
  track?: Track;
  mode: WindowMode;
  onExpand(): void;
}

export function TrackCard({ track, mode, onExpand }: TrackCardProps) {
  const compact = mode === "compact";
  const content = (
    <>
      <Artwork
        src={track?.artworkUrl}
        alt={track ? `${track.name} artwork` : "Album artwork"}
        className="h-11 w-11"
      />
      <div className="min-w-0 pr-20">
        <h1 className="truncate text-[16px] font-semibold leading-6 text-white">
          {track?.name || "Waiting for Last.fm"}
        </h1>
        <p className="truncate text-[12.5px] leading-[18.75px] text-white/62">
          <span>{track?.artist || "LyricSheet"}</span>
          {track?.album && <span className="px-1 text-white/42">·</span>}
          {track?.album && <span>{track.album}</span>}
        </p>
      </div>
    </>
  );

  const className = cn(
    "grid w-full grid-cols-[44px_minmax(0,1fr)] items-center gap-[11px] text-left",
    compact
      ? "app-no-drag px-[14px] py-3 transition hover:bg-white/[0.04]"
      : "app-drag px-[14px] py-3",
  );

  if (compact) {
    return (
      <button type="button" className={className} onClick={onExpand}>
        {content}
      </button>
    );
  }

  return (
    <header className={className}>
      {content}
    </header>
  );
}
