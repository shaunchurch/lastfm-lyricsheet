import {
  Maximize2,
  Minimize2,
  Pin,
  PinOff,
  RefreshCw,
  Settings,
} from "lucide-react";
import type { WindowMode } from "@/shared/types";
import { cn } from "../lib/utils";
import { Button } from "./ui/button";

interface WindowControlsProps {
  mode: WindowMode;
  pinned: boolean;
  onSetMode(mode: WindowMode): void;
  onTogglePinned(): void;
  onRetry(): void;
  onSettings(): void;
  showRetry: boolean;
}

export function WindowControls({
  mode,
  pinned,
  onSetMode,
  onTogglePinned,
  onRetry,
  onSettings,
  showRetry,
}: WindowControlsProps) {
  return (
    <div className="window-controls app-no-drag absolute right-2 top-2 z-30 flex items-center gap-1">
      {showRetry && (
        <Button
          type="button"
          variant="chrome"
          size="compactIcon"
          title="Retry lyrics"
          onClick={onRetry}
        >
          <RefreshCw size={14} />
        </Button>
      )}
      <Button
        type="button"
        variant="chrome"
        size="compactIcon"
        title={pinned ? "Unpin window" : "Pin window"}
        aria-pressed={pinned}
        className={cn(pinned && "bg-white/14 text-white/90")}
        onClick={onTogglePinned}
      >
        {pinned ? <Pin size={14} /> : <PinOff size={14} />}
      </Button>
      <Button
        type="button"
        variant="chrome"
        size="compactIcon"
        title="Settings"
        onClick={onSettings}
      >
        <Settings size={14} />
      </Button>
      <Button
        type="button"
        variant="chrome"
        size="compactIcon"
        title={mode === "expanded" ? "Minimize to compact" : "Expand lyric sheet"}
        aria-label={mode === "expanded" ? "Minimize to compact" : "Expand lyric sheet"}
        onClick={() => onSetMode(mode === "expanded" ? "compact" : "expanded")}
      >
        {mode === "expanded" ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
      </Button>
    </div>
  );
}
