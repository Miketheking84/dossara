import { describe, expect, it } from "vitest";
import en from "./messages/en.json";
import srLatn from "./messages/sr-Latn.json";
import { getMessages, getMissingMessageFallback, mergeMessages } from "./messages";

describe("translation messages", () => {
  it("falls back to English for a missing nested Serbian key", () => {
    const partialSerbian = structuredClone(srLatn);
    Reflect.deleteProperty(partialSerbian.Settings, "languageSaved");

    expect(mergeMessages(en, partialSerbian).Settings.languageSaved).toBe(en.Settings.languageSaved);
  });

  it("returns a visible marker when the key is missing in both catalogs", () => {
    expect(getMissingMessageFallback("Settings", "notPresent")).toBe("[missing:Settings.notPresent]");
  });

  it("uses Serbian as the primary catalog and English as the fallback", () => {
    expect(getMessages("sr-Latn").Settings.language).toBe("Jezik");
    expect(getMessages("en")).toBe(en);
  });
});
