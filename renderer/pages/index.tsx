import * as React from "react";
import Router from "next/router";
import LyricsPage from "../components/LyricsPage";
import { NextPage } from "next";
import Track from "../../interfaces/Track";

const IndexPage: NextPage = () => {
  const [currentTrack, setCurrentTrack] = React.useState<Track>();
  const [currentLyrics, setCurrentLyrics] = React.useState<string>(
    "Loading track and lyrics..."
  );
  const [error, setError] = React.useState<string>("");

  React.useEffect(() => {
    global.ipcRenderer.send("req-settings", true);
    global.ipcRenderer.on("track", (_event: any, track: Track) => {
      setCurrentTrack(track);
      setError("");
      window.scrollTo(0, 0);
    });
    global.ipcRenderer.on("lyrics", (_event: any, lyrics: string) => {
      setCurrentLyrics(lyrics);
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
      currentTrack={currentTrack}
      lyrics={currentLyrics}
      error={error}
    />
  );
};

export default IndexPage;
