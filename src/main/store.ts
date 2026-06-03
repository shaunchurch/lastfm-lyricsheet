import Store from "electron-store";
import type { LyricsResult, Settings } from "@/shared/types";
import { defaultSettings, normalizeSettings } from "./settings";

export interface LyricsCacheEntry extends LyricsResult {
  cacheVersion?: number;
  trackKey: string;
}

interface StoreSchema {
  settings: Settings;
  lyricsCache: Record<string, LyricsCacheEntry>;
}

let store: Store<StoreSchema> | undefined;
const LYRICS_CACHE_VERSION = 2;

function getStore(): Store<StoreSchema> {
  store ??= new Store<StoreSchema>({
    defaults: {
      settings: defaultSettings,
      lyricsCache: {},
    },
  });

  return store;
}

export function loadSettings(): Settings {
  return normalizeSettings(getStore().get("settings"));
}

export function saveSettings(settings: Settings): void {
  getStore().set("settings", normalizeSettings(settings));
}

export function getCachedLyrics(trackKey: string): LyricsCacheEntry | undefined {
  const entry = getStore().get("lyricsCache")[trackKey];
  if (entry?.cacheVersion !== LYRICS_CACHE_VERSION) return undefined;
  return entry;
}

export function setCachedLyrics(trackKey: string, result: LyricsResult): LyricsCacheEntry {
  const entry = {
    ...result,
    cacheVersion: LYRICS_CACHE_VERSION,
    trackKey,
  };
  getStore().set(`lyricsCache.${trackKey}`, entry);
  return entry;
}
