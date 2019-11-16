import styled from "styled-components";

export const PageBody = styled.div`
  min-height: 100vh;
`;

interface BackgroundStyleProps {
  backgroundImage?: string;
}

export const BackgroundStyle = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: -2;
  min-height: 100vh;

  background: linear-gradient(
        0deg,
        rgba(0, 0, 15, 0.5),
        rgba(0, 0, 15, 0.2) 80%,
        rgba(0, 0, 15, 0.5)
      )
      fixed,
    url(${(p: BackgroundStyleProps) => p.backgroundImage});

  background-size: cover;
  background-position: center;
  background-attachment: fixed;
  opacity: 0.2;
`;
