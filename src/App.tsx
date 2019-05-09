import React, { useEffect, useState } from "react";
import "./App.css";

const { ipcRenderer } = require("electron");

interface Track {
  backgroundImage: string;
  artist: string;
  release: string;
  title: string;
  lyrics: string;
}

// const ignoreAnchors = () => {
//   var anchors = document.getElementsByTagName("a");
//   for (var i = 0; i < anchors.length; i++) {
//     anchors[i].onclick = function() {
//       // window.open(this.getAttribute('href'), '_blank');
//       return false;
//     };
//   }
// };

const App: React.FC = () => {
  const [track, setTrack] = useState<Track>();

  useEffect(() => {
    ipcRenderer.on("new-track", (event: any, track: Track) => {
      console.log("NEW TRACK", event, track);
      setTrack(track);
      setWindowTitle(`${track.artist} - ${track.title} lyrics`);
    });
  }, []);

  const setWindowTitle = (title: string) => {
    window.document.title = title;
  };

  if (!track) {
    return null;
  }

  return (
    <>
      <div
        className="background-art"
        style={{ backgroundImage: `url(${track.backgroundImage})` }}
      />
      <div className="background-gradient" />
      <div className="lyric-body">
        <img
          className="artwork"
          src={track.backgroundImage}
          alt="meaningful description"
        />
        {track.artist}
        <em>{track.release}</em>
        <strong>{track.title}</strong>
        <div dangerouslySetInnerHTML={{ __html: track.lyrics }} />
      </div>
    </>
  );
};

export default App;
