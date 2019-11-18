import * as React from "react";
import Router from "next/router";
import LyricsPage from "../components/LyricsPage";
import { NextPage } from "next";
import Track from "../../interfaces/Track";

const IndexPage: NextPage = () => {
  const [nowPlayingTrack, setNowPlayingTrack] = React.useState<Track>();
  const [lastPlayedTrack, setLastPlayedTrack] = React.useState<Track>();
  const [nowPlayingLyrics, setNowPlayingLyrics] = React.useState<string>("");
  const [lastPlayedLyrics, setLastPlayedLyrics] = React.useState<string>("");
  const [error, setError] = React.useState<string>("");

  React.useEffect(() => {
    global.ipcRenderer.send("req-settings", true);
    global.ipcRenderer.on("nowPlayingTrack", (_event: any, track: Track) => {
      setNowPlayingTrack(track);
      setError("");
      window.scrollTo(0, 0);
    });
    global.ipcRenderer.on("nowPlayingLyrics", (_event: any, lyrics: string) => {
      setNowPlayingLyrics(lyrics);
      setError("");
      window.scrollTo(0, 0);
    });
    global.ipcRenderer.on("lastPlayedTrack", (_event: any, track: Track) => {
      setLastPlayedTrack(track);
      setError("");
      window.scrollTo(0, 0);
    });
    global.ipcRenderer.on("lastPlayedLyrics", (_event: any, lyrics: string) => {
      setLastPlayedLyrics(lyrics);
      setError("");
      window.scrollTo(0, 0);
    });
    global.ipcRenderer.on("settings-required", (_event: any, _data) => {
      Router.push("/settings");
    });
    global.ipcRenderer.on("error", (_event: any, error: string) => {
      setError(error);
    });
  }, []);

  return (
    <LyricsPage
      nowPlayingTrack={nowPlayingTrack}
      nowPlayingLyrics={nowPlayingLyrics}
      lastPlayedTrack={lastPlayedTrack}
      lastPlayedLyrics={lastPlayedLyrics}
      error={error}
    />
  );
};

export default IndexPage;
