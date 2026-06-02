export type WindowMode = "compact" | "expanded";

export interface WindowBounds {
  x?: number;
  y?: number;
  width: number;
  height: number;
}

export interface Settings {
  lastfmApiKey: string;
  lastfmUsername: string;
  geniusAccessToken: string;
  alwaysOnTop: boolean;
  windowMode: WindowMode;
  pollIntervalSeconds: number;
  windowBounds?: WindowBounds;
}

export interface LegacySettings {
  geniusClientAccessToken?: string;
  lastfmApiKey?: string;
  lastfmSecret?: string;
  lastfmUsername?: string;
}

export interface Track {
  id: string;
  name: string;
  artist: string;
  album: string;
  artworkUrl: string;
  lastfmUrl?: string;
  mbid?: string;
  nowPlaying: boolean;
  playedAt?: string;
}

export interface LyricsResult {
  providerId: string;
  providerName: string;
  html: string;
  sourceUrl: string;
  fetchedAt: string;
}

export type LyricsStatus = "idle" | "loading" | "ready" | "error" | "not-found";

export interface LyricsState {
  status: LyricsStatus;
  html: string;
  providerName?: string;
  sourceUrl?: string;
  error?: string;
  cached?: boolean;
}

export interface ProviderStatus {
  nowPlaying: "idle" | "connecting" | "listening" | "error";
  lyrics: "idle" | "searching" | "error";
  error?: string;
}

export interface AppState {
  configured: boolean;
  settings: Settings;
  track?: Track;
  lyrics: LyricsState;
  providerStatus: ProviderStatus;
  windowMode: WindowMode;
  alwaysOnTop: boolean;
}

export interface LyricsCandidate {
  providerId: string;
  providerName: string;
  title: string;
  artist: string;
  url: string;
  score: number;
}

export interface LyricsProvider {
  id: string;
  name: string;
  search(track: Track, settings: Settings): Promise<LyricsCandidate[]>;
  fetch(candidate: LyricsCandidate): Promise<LyricsResult>;
}

export interface NowPlayingProvider {
  id: string;
  name: string;
  start(settings: Settings, handlers: NowPlayingHandlers): void;
  stop(): void;
}

export interface NowPlayingHandlers {
  onTrack(track: Track): void;
  onError(error: string): void;
  onStatus(status: ProviderStatus["nowPlaying"]): void;
}
