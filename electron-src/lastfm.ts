import Settings from "../interfaces/Settings";
import LastFmTrack from "../interfaces/LastFmTrack";
const LastFmNode = require("lastfm").LastFmNode;

let lastfmStream: any;

export function connectLastFM(
  settings: Settings,
  onNowPlaying: Function,
  onLastPlayed: Function,
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
    lastfmStream.on("nowPlaying", handleNowPlaying);
    lastfmStream.on("lastPlayed", handleLastPlayed);
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

  function handleNowPlaying(track: LastFmTrack) {
    onNowPlaying(track);
  }

  function handleLastPlayed(track: LastFmTrack) {
    onLastPlayed(track);
  }

  function handleLoggedEvent(event: string, data: any) {
    console.log("Log", event);
    if (event === "error") {
      console.log("Error", data);
      onError(data.message);
    }
  }

  return lastfmStream;
}
