import styled from "styled-components";

export const LyricWrapper = styled.div`
  text-align: center;
  font-weight: 300;
  span {
    padding: 4px;
  }
`;

export const Artist = styled.span`
  display: block;
`;
export const Album = styled.span`
  display: block;
  font-style: italic;
`;
export const Name = styled.span`
  display: block;
  font-size: 1.3rem;
  font-weight: 500;
`;

export const Artwork = styled.img`
  width: 156px;
  height: 156px;
  border-radius: 6px;
  /* box-shadow: 1px 1px 2px rgba(0, 0, 0, 0.2); */
  margin-bottom: 12px;
  border: 0;
  outline: 0;
  margin-right: ${p => p.theme.padding * 3}px;
`;

export const Lyrics = styled.div`
  line-height: 1.5rem;

  a {
    -webkit-app-region: no-drag;
    text-decoration: none;
    color: #f1f1f1;
    cursor: default;
  }
`;

export const SongHeader = styled.header`
  display: flex;
  flex: column;
  align-items: center;
  justify-content: center;
`;

export const SongHeaderMeta = styled.div`
  text-align: left;
`;
