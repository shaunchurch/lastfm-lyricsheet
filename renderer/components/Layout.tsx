import * as React from "react";
import Link from "next/link";
import Head from "next/head";
import * as S from "./Layout.styles";
import { GlobalStyle } from "../glboalStyles";

type Props = {
  title?: string;
};

const Layout: React.FunctionComponent<Props> = ({
  children,
  title = "This is the default title"
}) => (
  <>
    <Head>
      <title>{title}</title>
      <meta charSet="utf-8" />
      <meta name="viewport" content="initial-scale=1.0, width=device-width" />
    </Head>
    <S.PageBody>
      <header>
        <nav>
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
