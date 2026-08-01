import type { AppLocale } from "../i18n/config";
import { isAppLocale } from "../i18n/config";

type SettingsRecord = Record<string, unknown>;

export type LocalePreferenceDependencies = {
  readFile(path: string, encoding: "utf8"): Promise<string>;
  mkdir(path: string, options: { recursive: true }): Promise<unknown>;
  writeFile(path: string, content: string, options: { encoding: "utf8"; flag: "wx" }): Promise<unknown>;
  rename(from: string, to: string): Promise<void>;
  rm(path: string, options: { force: true }): Promise<void>;
  dirname(path: string): string;
  basename(path: string): string;
  join(...paths: string[]): string;
  randomUUID(): string;
};

function parseSettings(raw: string): SettingsRecord {
  const value: unknown = JSON.parse(raw);
  if (typeof value !== "object" || value === null || Array.isArray(value)) throw new Error("PREFERENCE_UNAVAILABLE");
  return value as SettingsRecord;
}

async function readOptionalSettings(settingsPath: string, dependencies: LocalePreferenceDependencies): Promise<SettingsRecord | null> {
  try { return parseSettings(await dependencies.readFile(settingsPath, "utf8")); }
  catch (error) { if ((error as NodeJS.ErrnoException).code === "ENOENT") return null; throw error; }
}

export interface LocalePreferenceStore {
  getLocale(): Promise<AppLocale | null>;
  setLocale(locale: AppLocale): Promise<void>;
}

export function createLocalePreferenceStore(settingsPath: string, dependencies: LocalePreferenceDependencies): LocalePreferenceStore {
  return {
    async getLocale() {
      const settings = await readOptionalSettings(settingsPath, dependencies);
      return isAppLocale(settings?.uiLocale) ? settings.uiLocale : null;
    },
    async setLocale(locale) {
      if (!isAppLocale(locale)) throw new Error("INVALID_LOCALE");
      const settings = await readOptionalSettings(settingsPath, dependencies);
      const directory = dependencies.dirname(settingsPath);
      const content = `${JSON.stringify({ ...settings, uiLocale: locale }, null, 2)}\n`;
      parseSettings(content);
      const temporaryPath = dependencies.join(
        directory,
        `.${dependencies.basename(settingsPath)}.${dependencies.randomUUID()}.tmp`,
      );

      await dependencies.mkdir(directory, { recursive: true });
      try {
        await dependencies.writeFile(temporaryPath, content, { encoding: "utf8", flag: "wx" });
        await dependencies.rename(temporaryPath, settingsPath);
      } catch (error) {
        try {
          await dependencies.rm(temporaryPath, { force: true });
        } catch {
          // Preserve the write or replacement failure as the actionable error.
        }
        throw error;
      }
    },
  };
}
