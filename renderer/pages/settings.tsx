import * as React from "react";
import Layout from "../components/Layout";
import * as S from "../styles/Settings.styles";
import Settings from "../../interfaces/Settings";

const SettingsPage: React.FunctionComponent = () => {
  const [settings, setSettings] = React.useState<Settings>();

  React.useEffect(() => {
    global.ipcRenderer.on("res-settings", handleResSettings);
    global.ipcRenderer.send("req-settings", true);
    return () => {
      global.ipcRenderer.off("res-settings", handleResSettings);
    };
  }, []);

  function handleResSettings(_event: any, settings: Settings) {
    console.log("Loaded settings");
    setSettings(settings);
  }

  function handleChange(e: React.FormEvent<HTMLInputElement>) {
    const field = e.currentTarget.name;
    const value = e.currentTarget.value;
    setSettings({ ...settings, [field]: value });
  }

  function handleSubmit(e: React.SyntheticEvent) {
    e.preventDefault();
    global.ipcRenderer.send("req-save-settings", settings);
  }

  return (
    <Layout title="Lyric Sheet Settings">
      <h1>Settings</h1>
      <p>Configure your API keys and username.</p>
      <form onSubmit={handleSubmit}>
        <S.Label>
          <span>Genius API Key</span>
          <input
            type="password"
            name="geniusClientAccessToken"
            value={settings?.geniusClientAccessToken || ""}
            onChange={handleChange}
          />
        </S.Label>
        <S.Label>
          <span>Lastfm API Key</span>
          <input
            type="password"
            name="lastfmApiKey"
            value={settings?.lastfmApiKey || ""}
            onChange={handleChange}
          />
        </S.Label>
        <S.Label>
          <span>Lastfm Secret</span>
          <input
            type="password"
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
    </Layout>
  );
};

export default SettingsPage;
