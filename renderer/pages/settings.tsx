import * as React from "react";
import Link from "next/link";
import Layout from "../components/Layout";
import * as S from "./Settings.styles";

interface Settings {
  geniusClientAccessToken?: string;
  lastfmApiKey?: string;
  lastfmSecret?: string;
  lastfmUsername?: string;
}

const SettingsPage: React.FunctionComponent = () => {
  const [settings, setSettings] = React.useState<Settings>();

  React.useEffect(() => {
    global.ipcRenderer.on("rec-settings", handleGetSettings);
    global.ipcRenderer.send("req-settings", true);
  }, []);

  function handleGetSettings(_event: any, settings: Settings) {
    console.log("Loaded settings", settings);
    setSettings(settings);
  }

  function handleChange(e: React.FormEvent<HTMLInputElement>) {
    const field = e.currentTarget.name;
    const value = e.currentTarget.value;
    setSettings({ ...settings, [field]: value });
  }

  function handleSubmit(e: React.SyntheticEvent) {
    e.preventDefault();
    global.ipcRenderer.send("save-settings", settings);
  }

  return (
    <Layout title="Lyric Sheet Settings">
      <h1>Settings</h1>
      <p>Configure your API keys and username.</p>
      <form onSubmit={handleSubmit}>
        <S.Label>
          <span>Genius API Key</span>
          <input
            type="text"
            name="geniusClientAccessToken"
            value={settings?.geniusClientAccessToken || ""}
            onChange={handleChange}
          />
        </S.Label>
        <S.Label>
          <span>Lastfm API Key</span>
          <input
            type="text"
            name="lastfmApiKey"
            value={settings?.lastfmApiKey || ""}
            onChange={handleChange}
          />
        </S.Label>
        <S.Label>
          <span>Lastfm Secret</span>
          <input
            type="text"
            name="lastfmSecret"
            value={settings?.lastfmSecret || ""}
            onChange={handleChange}
          />
        </S.Label>
        <S.Label>
          <span>Lastfm Username</span>
          <input
            type="text"
            name="lastfmUsername"
            value={settings?.lastfmUsername || ""}
            onChange={handleChange}
          />
        </S.Label>
        <button>Save</button>
      </form>
      <p>
        <Link href="/">
          <a>Go home</a>
        </Link>
      </p>
    </Layout>
  );
};

export default SettingsPage;
