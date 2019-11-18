import * as React from "react";
import Router from "next/router";
import Layout from "../components/Layout";
import * as S from "../styles/Settings.styles";
import * as G from "../globalStyles";
import Settings from "../../interfaces/Settings";

const SettingsPage: React.FunctionComponent = () => {
  const [settings, setSettings] = React.useState<Settings>();
  const [error, setError] = React.useState<string>();

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
    if (!validateSettings(settings)) {
      return setError("Please enter all the required settings.");
    }

    setError(undefined);
    global.ipcRenderer.send("req-save-settings", settings);
    Router.push("/");
  }

  function validateSettings(settings: Settings | undefined): boolean {
    if (typeof settings === "undefined" || settings === null) {
      return false;
    }

    let valid = false;
    if (
      isSettingValid(settings.geniusClientAccessToken || "") &&
      isSettingValid(settings.lastfmSecret || "") &&
      isSettingValid(settings.lastfmApiKey || "") &&
      isSettingValid(settings.lastfmUsername || "")
    ) {
      valid = true;
    }
    return valid;
  }

  function isSettingValid(setting: string) {
    if (setting !== "") {
      return true;
    }
    return false;
  }

  return (
    <Layout title="Lyric Sheet Settings">
      <h1>Settings</h1>
      <p>Configure your API keys and username.</p>
      <form onSubmit={handleSubmit}>
        <S.Label>
          <span>Genius Client Access Token</span>
          <input
            type="password"
            name="geniusClientAccessToken"
            value={settings?.geniusClientAccessToken || ""}
            onChange={handleChange}
          />
        </S.Label>
        <S.Label>
          <span>Last.fm API Key</span>
          <input
            type="password"
            name="lastfmApiKey"
            value={settings?.lastfmApiKey || ""}
            onChange={handleChange}
          />
        </S.Label>
        <S.Label>
          <span>Last.fm Secret</span>
          <input
            type="password"
            name="lastfmSecret"
            value={settings?.lastfmSecret || ""}
            onChange={handleChange}
          />
        </S.Label>
        <S.Label>
          <span>Last.fm Username</span>
          <input
            type="text"
            name="lastfmUsername"
            value={settings?.lastfmUsername || ""}
            onChange={handleChange}
          />
        </S.Label>
        {error && <G.Error>{error}</G.Error>}
        <G.Button>Save</G.Button>
      </form>
    </Layout>
  );
};

export default SettingsPage;
