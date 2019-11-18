import styled, { createGlobalStyle } from "styled-components";

export const theme = {
  foreground: "#f1f1f1",
  background: "#222",
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", sans-serif',
  padding: 8,
  radius: 4
};

export const GlobalStyle = createGlobalStyle`

  html,
  body
  #__next {
    min-height: 100vh; 
    -webkit-app-region: drag;
    text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.3);
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

export const Button = styled.button`
  background: palevioletred;
  border: none;
  border-radius: ${p => p.theme.radius}px;
  padding: ${p => p.theme.padding}px ${p => p.theme.padding * 2}px;
  color: ${p => p.theme.foreground};
  font-size: 1.1rem;
  font-weight: bold;
`;

export const Error = styled.p`
  color: palevioletred;
`;
