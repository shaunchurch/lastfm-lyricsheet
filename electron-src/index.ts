import { join } from "path";
import { format } from "url";

import { BrowserWindow, app } from "electron";
import isDev from "electron-is-dev";
import prepareNext from "electron-next";
import { ipc } from "./ipc";
import { connectLastFM } from "./lastfm";
import { configureGenius, searchGenius } from "./genius";
import Settings from "../interfaces/Settings";
import LastFmTrack from "../interfaces/LastFmTrack";
import Track from "../interfaces/Track";

import * as sanitise from "./sanitise";

// Prepare the renderer once the app is ready
app.on("ready", async () => {
  await prepareNext("./renderer");

  const mainWindow = new BrowserWindow({
    width: 600,
    height: 800,
    transparent: true,
    darkTheme: true,
    vibrancy: "dark",
    titleBarStyle: "hidden",
    webPreferences: {
      nodeIntegration: false,
      preload: join(__dirname, "preload.js"),
      scrollBounce: true
    }
  });

  const url = isDev
    ? "http://localhost:8000/"
    : format({
        pathname: join(__dirname, "../../renderer/out/index.html"),
        protocol: "file:",
        slashes: true
      });

  mainWindow.loadURL(url);

  function createTrack(lastFmTrack: LastFmTrack): Track {
    if (typeof lastFmTrack === "undefined")
      throw new Error("No lastFmTrack avaiable");
    if (!lastFmTrack.artist || !lastFmTrack.name)
      throw new Error("No artist or track name on lastFmTrack");

    const track: Track = {
      name: lastFmTrack.name,
      artist: lastFmTrack.artist["#text"],
      album: sanitise.getAlbumName(lastFmTrack),
      backgroundImage: sanitise.getBackgroundImage(lastFmTrack)
    };
    return track;
  }

  function createQuery(track: Track) {
    return `${track.artist} ${sanitise.stripExtras(track.name)}`;
  }

  async function handleNowPlaying(lastFmTrack: LastFmTrack) {
    const track = createTrack(lastFmTrack);
    const query = createQuery(track);
    const lyrics = await searchGenius(query);
    try {
      mainWindow.webContents.send("nowPlayingLyrics", lyrics);
      mainWindow.webContents.send("nowPlayingTrack", track);
    } catch (e) {
      console.error(e);
      handleError(e.message);
    }
  }

  async function handleLastPlayed(lastFmTrack: LastFmTrack) {
    const track = createTrack(lastFmTrack);
    const query = createQuery(track);
    const lyrics = await searchGenius(query);
    try {
      mainWindow.webContents.send("lastPlayedLyrics", lyrics);
      mainWindow.webContents.send("lastPlayedTrack", track);
    } catch (e) {
      console.error(e);
      handleError(e.message);
    }
  }

  function handleError(error: string) {
    mainWindow.webContents.send("error", error);
  }

  function onLoadedSettings(settings: Settings) {
    if (
      settings &&
      settings.lastfmApiKey &&
      settings.lastfmSecret &&
      settings.lastfmUsername
    ) {
      connectLastFM(settings, handleNowPlaying, handleLastPlayed, handleError);
    }

    if (settings && settings.geniusClientAccessToken) {
      configureGenius(settings);
    }

    if (typeof settings === "undefined") {
      mainWindow.webContents.send("settings-required", true);
    }
  }

  ipc(onLoadedSettings);
});

// Quit the app once all windows are closed
app.on("window-all-closed", app.quit);
