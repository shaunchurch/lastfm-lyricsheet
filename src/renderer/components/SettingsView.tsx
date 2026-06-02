import { FormEvent, useEffect, useState } from "react";
import { ArrowLeft, Save } from "lucide-react";
import type { Settings } from "@/shared/types";
import { Button } from "./ui/button";
import { Input } from "./ui/input";

interface SettingsViewProps {
  settings: Settings;
  onSave(settings: Partial<Settings>): Promise<void>;
  onBack(): void;
}

export function SettingsView({ settings, onSave, onBack }: SettingsViewProps) {
  const [form, setForm] = useState(settings);
  const [error, setError] = useState("");
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    if (!isDirty) {
      setForm(settings);
    }
  }, [isDirty, settings]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (
      !form.lastfmApiKey.trim() ||
      !form.lastfmUsername.trim() ||
      !form.geniusAccessToken.trim()
    ) {
      setError("Please enter the required settings.");
      return;
    }

    try {
      setError("");
      await onSave(form);
      setIsDirty(false);
      onBack();
    } catch (error) {
      setError(error instanceof Error ? error.message : "Unable to save settings.");
    }
  }

  function updateForm<Field extends keyof Settings>(
    field: Field,
    value: Settings[Field],
  ) {
    setIsDirty(true);
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  return (
    <main className="app-drag lyric-panel relative flex h-screen flex-col overflow-hidden text-white">
      <div className="relative z-10 flex shrink-0 items-center justify-between border-b border-white/10 px-4 py-3">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          title="Back"
          onClick={onBack}
        >
          <ArrowLeft size={17} />
        </Button>
        <h1 className="text-sm font-semibold text-white/78">Settings</h1>
        <div className="h-8 w-8" />
      </div>
      <form
        className="app-no-drag relative z-10 flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-5 py-5"
        onSubmit={handleSubmit}
      >
        <Field label="Last.fm API key">
          <Input
            name="lastfmApiKey"
            type="password"
            value={form.lastfmApiKey}
            onChange={(event) =>
              updateForm("lastfmApiKey", event.currentTarget.value)
            }
          />
        </Field>
        <Field label="Last.fm username">
          <Input
            name="lastfmUsername"
            type="text"
            value={form.lastfmUsername}
            onChange={(event) =>
              updateForm("lastfmUsername", event.currentTarget.value)
            }
          />
        </Field>
        <Field label="Genius access token">
          <Input
            name="geniusAccessToken"
            type="password"
            value={form.geniusAccessToken}
            onChange={(event) =>
              updateForm("geniusAccessToken", event.currentTarget.value)
            }
          />
        </Field>
        <Field label="Poll interval">
          <Input
            name="pollIntervalSeconds"
            type="number"
            min={5}
            step={1}
            value={form.pollIntervalSeconds}
            onChange={(event) =>
              updateForm("pollIntervalSeconds", Number(event.currentTarget.value))
            }
          />
        </Field>
        {error && <p className="text-sm text-rose-300">{error}</p>}
        <Button type="submit" className="mt-auto">
          <Save size={16} />
          Save
        </Button>
      </form>
    </main>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="grid gap-2">
      <span className="text-xs font-medium uppercase tracking-[0.08em] text-white/48">
        {label}
      </span>
      {children}
    </label>
  );
}
