import * as React from "react";
import Link from "next/link";
import Head from "next/head";
import * as S from "./Layout.styles";
import { GlobalStyle } from "../globalStyles";
import { MdSettings } from "react-icons/md";

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
        <S.SettingsIcon>
          <Link href="/settings">
            <a>
              <MdSettings />
            </a>
          </Link>
        </S.SettingsIcon>
      </header>
      <main>{children}</main>
    </S.PageBody>
    <GlobalStyle />
  </>
);

export default Layout;
