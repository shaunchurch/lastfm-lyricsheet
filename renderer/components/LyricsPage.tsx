import { useEffect } from "react";
import Link from "next/link";
import Layout from "../components/Layout";
import Track from "../../interfaces/Track";
import * as S from "./LyricsPage.styles";
import * as G from "../globalStyles";

interface Props {
  nowPlayingTrack?: Track;
  nowPlayingLyrics?: string;
  lastPlayedTrack?: Track;
  lastPlayedLyrics?: string;
  error?: string;
}

export default function LyricsPage({
  nowPlayingTrack,
  nowPlayingLyrics,
  lastPlayedTrack,
  lastPlayedLyrics,
  error
}: Props) {
  const currentTrack = nowPlayingTrack?.artist
    ? nowPlayingTrack
    : lastPlayedTrack;

  const currentLyrics =
    nowPlayingLyrics !== "" ? nowPlayingLyrics : lastPlayedLyrics;

  useEffect(() => {
    let main = document.getElementsByTagName("main");
    var anchors = main[0].getElementsByTagName("a");
    for (var i = 0; i < anchors.length; i++) {
      anchors[i].onclick = function() {
        // window.open(this.getAttribute('href'), '_blank');
        return false;
      };
    }
  }, [currentLyrics]);

  if (error !== "") {
    return (
      <Layout
        title="Lyric Sheet"
        backgroundImage={currentTrack?.backgroundImage}
      >
        <S.LyricWrapper>
          <G.Error>{error}</G.Error>
          <Link href="/settings">
            <G.Button>Configure settings</G.Button>
          </Link>
        </S.LyricWrapper>
      </Layout>
    );
  }

  return (
    <Layout title="Lyric Sheet" backgroundImage={currentTrack?.backgroundImage}>
      <S.LyricWrapper>
        <S.SongHeader>
          {currentTrack?.backgroundImage && (
            <S.Artwork src={currentTrack?.backgroundImage} />
          )}
          <S.SongHeaderMeta>
            <S.Artist>{currentTrack?.artist}</S.Artist>
            <S.Album>{currentTrack?.album}</S.Album>
            <S.Name>{currentTrack?.name}</S.Name>
          </S.SongHeaderMeta>
        </S.SongHeader>
        <S.Lyrics dangerouslySetInnerHTML={{ __html: currentLyrics || "" }} />
      </S.LyricWrapper>
    </Layout>
  );
}
