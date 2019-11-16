enum ImageSize {
  small = "small",
  medium = "medium",
  large = "large",
  extralarge = "extralarge"
}

export default interface LastFmTrack {
  artist: {
    mbid: string;
    "#text": string;
  };
  album: {
    mbid: string;
    "#text": string;
  };
  image: { size: ImageSize; "#text": string }[];
  streamable: string;
  date: { uts: string; "#text": string };
  url: string;
  name: string;
  mbid: string;
}
