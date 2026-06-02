import type { LegacySettings, Settings } from "@/shared/types";

export const compactWindowSize = {
  width: 344,
  height: 70,
};

export const expandedWindowSize = {
  width: 344,
  height: 540,
};

export const defaultSettings: Settings = {
  lastfmApiKey: "",
  lastfmUsername: "",
  geniusAccessToken: "",
  alwaysOnTop: true,
  windowMode: "compact",
  pollIntervalSeconds: 10,
};

export function normalizeSettings(input: Partial<Settings> & LegacySettings = {}): Settings {
  const pollIntervalSeconds = Number(input.pollIntervalSeconds);

  return {
    ...defaultSettings,
    ...input,
    geniusAccessToken:
      input.geniusAccessToken?.trim() ??
      input.geniusClientAccessToken?.trim() ??
      "",
    lastfmApiKey: input.lastfmApiKey?.trim() ?? "",
    lastfmUsername: input.lastfmUsername?.trim() ?? "",
    alwaysOnTop: input.alwaysOnTop ?? defaultSettings.alwaysOnTop,
    windowMode: input.windowMode ?? defaultSettings.windowMode,
    pollIntervalSeconds:
      Number.isFinite(pollIntervalSeconds) && pollIntervalSeconds >= 5
        ? pollIntervalSeconds
        : defaultSettings.pollIntervalSeconds,
  };
}

export function isConfigured(settings: Settings): boolean {
  return Boolean(
    settings.lastfmApiKey.trim() &&
      settings.lastfmUsername.trim() &&
      settings.geniusAccessToken.trim(),
  );
}
