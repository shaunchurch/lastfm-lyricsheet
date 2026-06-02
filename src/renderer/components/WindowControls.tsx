import {
  Maximize2,
  Minimize2,
  Pin,
  PinOff,
  RefreshCw,
  Settings,
} from "lucide-react";
import type { ReactNode } from "react";
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
    <div className="window-controls app-no-drag absolute right-2 top-2 z-30 flex items-center gap-1.5">
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
        className={cn(pinned && "bg-white/12 text-white/90")}
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
      <div className="mode-pill" aria-label="Window mode">
        <ModeButton
          active={mode === "compact"}
          title="Compact mode"
          onClick={() => onSetMode("compact")}
        >
          <Minimize2 size={13} />
        </ModeButton>
        <ModeButton
          active={mode === "expanded"}
          title="Expanded mode"
          onClick={() => onSetMode("expanded")}
        >
          <Maximize2 size={13} />
        </ModeButton>
      </div>
    </div>
  );
}

function ModeButton({
  active,
  children,
  title,
  onClick,
}: {
  active: boolean;
  children: ReactNode;
  title: string;
  onClick(): void;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      className={cn("mode-pill-button", active && "mode-pill-button-active")}
      title={title}
      onClick={onClick}
    >
      {children}
    </button>
  );
}
