import "server-only";

import { mkdir, readFile, rename, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import type { AppLocale } from "@/i18n/config";
import { createLocalePreferenceStore, type LocalePreferenceDependencies } from "./locale-preference-store";

const nodeDependencies: LocalePreferenceDependencies = {
  readFile,
  mkdir,
  writeFile,
  rename,
  rm,
  dirname: path.dirname,
  basename: path.basename,
  join: path.join,
  randomUUID,
};
const localePreferenceStore = createLocalePreferenceStore(path.join(process.cwd(), ".sdj-mike", "settings.json"), nodeDependencies);

export function getLocalePreference() { return localePreferenceStore.getLocale(); }
export function setLocalePreference(locale: AppLocale) { return localePreferenceStore.setLocale(locale); }
