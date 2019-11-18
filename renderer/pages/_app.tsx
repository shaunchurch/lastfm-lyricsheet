import React from "react";
import App from "next/app";
import { ThemeProvider } from "styled-components";
import { theme } from "../globalStyles";

class MyApp extends App {
  render() {
    const { Component, pageProps } = this.props;

    return (
      <ThemeProvider theme={theme}>
        <Component {...pageProps} />
      </ThemeProvider>
    );
  }
}

export default MyApp;
