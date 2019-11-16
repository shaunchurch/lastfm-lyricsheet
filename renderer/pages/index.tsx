import * as React from "react";
import Layout from "../components/Layout";
import { NextPage } from "next";

const IndexPage: NextPage = () => {
  React.useEffect(() => {
    // global.ipcRenderer.send("message", "ping");
    // global.ipcRenderer.on("reply", message => console.log("REPLy", message));
  }, []);

  return (
    <Layout title="Lyric Sheet">
      <h1>Main</h1>
    </Layout>
  );
};

export default IndexPage;
