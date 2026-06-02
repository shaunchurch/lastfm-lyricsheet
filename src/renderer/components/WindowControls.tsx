import {
  Maximize2,
  Minimize2,
  Pin,
  PinOff,
  RefreshCw,
  Settings,
} from "lucide-react";
import type { WindowMode } from "@/shared/types";
import { Button } from "./ui/button";

interface WindowControlsProps {
  mode: WindowMode;
  pinned: boolean;
  onToggleMode(): void;
  onTogglePinned(): void;
  onRetry(): void;
  onSettings(): void;
  showRetry: boolean;
}

export function WindowControls({
  mode,
  pinned,
  onToggleMode,
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
          <RefreshCw size={15} />
        </Button>
      )}
      <Button
        type="button"
        variant="chrome"
        size="compactIcon"
        title={pinned ? "Unpin window" : "Pin window"}
        onClick={onTogglePinned}
      >
        {pinned ? <Pin size={15} /> : <PinOff size={15} />}
      </Button>
      <Button
        type="button"
        variant="chrome"
        size="compactIcon"
        title="Settings"
        onClick={onSettings}
      >
        <Settings size={15} />
      </Button>
      <Button
        type="button"
        variant="chrome"
        size="compactIcon"
        title={mode === "compact" ? "Expand" : "Collapse"}
        onClick={onToggleMode}
      >
        {mode === "compact" ? <Maximize2 size={15} /> : <Minimize2 size={15} />}
      </Button>
    </div>
  );
}
