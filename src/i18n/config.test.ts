import { describe, expect, it } from "vitest";
import {
  DEFAULT_LOCALE,
  FALLBACK_LOCALE,
  INTL_LOCALE_BY_APP_LOCALE,
  isAppLocale,
  SUPPORTED_LOCALES,
} from "./config";
import { mergeMessages, messageKeys } from "./messages";
import en from "./messages/en.json";
import srLatn from "./messages/sr-Latn.json";

describe("i18n configuration", () => {
  it("defines only the supported typed application locales", () => {
    expect(SUPPORTED_LOCALES).toEqual(["sr-Latn", "en"]);
    expect(DEFAULT_LOCALE).toBe("sr-Latn");
    expect(FALLBACK_LOCALE).toBe("en");
    expect(INTL_LOCALE_BY_APP_LOCALE["sr-Latn"]).toBe("sr-Latn-RS");
    expect(isAppLocale("en")).toBe(true);
    expect(isAppLocale("sr")).toBe(false);
  });

  it("keeps both message catalogs structurally identical", () => {
    expect(messageKeys(srLatn).sort()).toEqual(messageKeys(en).sort());
  });

  it("uses the English catalog as a fallback for a missing Serbian message", () => {
    const partialSerbian = { ...srLatn, Navigation: { ...srLatn.Navigation } };
    delete (partialSerbian.Navigation as Partial<typeof srLatn.Navigation>).today;
    expect(mergeMessages(en, partialSerbian).Navigation.today).toBe("Today");
  });
});
