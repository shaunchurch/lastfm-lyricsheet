import Settings from "../interfaces/Settings";
const LastFmNode = require("lastfm").LastFmNode;

let lastfmStream: any;

export function connectLastFM(
  settings: Settings,
  onTrackPlayed: Function,
  onError: Function
) {
  if (lastfmStream && lastfmStream.isStreaming()) {
    stopStream();
  }

  const lastfm = new LastFmNode({
    api_key: settings.lastfmApiKey,
    secret: settings.lastfmSecret,
    useragent: "Choon"
  });

  startStream();

  function startStream() {
    lastfmStream = lastfm.stream(settings.lastfmUsername);
    lastfmStream.on("nowPlaying", handleStreamingTrack);
    lastfmStream.on("lastPlayed", (data: any) =>
      handleLoggedEvent("lastPlayed", data)
    );
    lastfmStream.on("nowPlaying", (data: any) =>
      handleLoggedEvent("nowPlaying", data)
    );
    lastfmStream.on("scrobbled", (data: any) =>
      handleLoggedEvent("scrobbled", data)
    );
    lastfmStream.on("stoppedPlaying", (data: any) =>
      handleLoggedEvent("stoppedPlaying", data)
    );
    lastfmStream.on("error", (data: any) => handleLoggedEvent("error", data));
    lastfmStream.start();
  }

  function stopStream() {
    lastfmStream.stop();
    lastfmStream = null;
  }

  function handleStreamingTrack(track: any) {
    onTrackPlayed(track);
  }

  function handleLoggedEvent(event: string, data: any) {
    console.log("Log", event, "-", data);
    if (event === "lastPlayed") {
      onTrackPlayed(data);
    }
    if (event === "error") {
      onError(data.message);
    }
  }

  return lastfmStream;
}
