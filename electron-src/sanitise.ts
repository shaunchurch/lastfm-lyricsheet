const sanitizeHtml = require("sanitize-html");
import LastFmTrack from "../interfaces/LastFmTrack";

export const getBackgroundImage = (track: LastFmTrack) => {
  if (!track.image || !track.image.length) return "";
  const image = track.image[track.image.length - 1]["#text"];
  return image;
};

export const getAlbumName = (track: LastFmTrack) => {
  if (!track.album) return "";
  return track.album["#text"];
};

export const stripExtras = (name: string) => {
  return name
    .toLowerCase()
    .replace("(live)", "")
    .split("-")[0];
};

export const sanitizeLyric = (lyric: string) => {
  return sanitizeHtml(lyric, {
    allowedTags: ["em"]
  }).trim();
};
