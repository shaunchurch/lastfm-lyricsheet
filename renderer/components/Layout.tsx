import * as React from "react";
import Link from "next/link";
import Head from "next/head";
import * as S from "./Layout.styles";
import { GlobalStyle } from "../glboalStyles";

type Props = {
  title?: string;
  backgroundImage?: string;
};

const Layout: React.FunctionComponent<Props> = ({
  children,
  title = "This is the default title",
  backgroundImage = ""
}) => (
  <>
    <Head>
      <title>{title}</title>
      <meta charSet="utf-8" />
      <meta name="viewport" content="initial-scale=1.0, width=device-width" />
    </Head>
    <S.PageBody>
      <S.BackgroundStyle backgroundImage={backgroundImage} />
      <header>
        <nav>
          <Link href="/">
            <a>Lyrics</a>
          </Link>{" "}
          <Link href="/settings">
            <a>Settings</a>
          </Link>
        </nav>
      </header>
      {children}
    </S.PageBody>
    <GlobalStyle />
  </>
);

export default Layout;
