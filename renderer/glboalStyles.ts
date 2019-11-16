import { createGlobalStyle } from "styled-components";

export const theme = {
  foreground: "#f1f1f1",
  background: "#222",
  fontFamily: "sans-serif",
  padding: 8,
  radius: 4
};

export const GlobalStyle = createGlobalStyle`

  html,
  body
  #__next {
    min-height: 100vh; 
    -webkit-app-region: drag;
  }

  body {
    color: ${p => p.theme.foreground};
    font-family: ${props => props.theme.fontFamily};
    margin: 0;
    padding: 0;
  }

  a{
    color: ${p => p.theme.foreground};
  }
`;
