import { describe, expect, it } from "vitest";
import { parseLocalePreferenceInput } from "./locale-preference-request";

describe("locale preference route input", () => {
  it("accepts only a supported locale in the exact request shape", () => {
    expect(parseLocalePreferenceInput({ locale: "sr-Latn" })).toBe("sr-Latn");
    expect(parseLocalePreferenceInput({ locale: "en" })).toBe("en");
  });

  it("rejects unsupported, missing, and extra input", () => {
    expect(parseLocalePreferenceInput({ locale: "sr" })).toBeNull();
    expect(parseLocalePreferenceInput({})).toBeNull();
    expect(parseLocalePreferenceInput({ locale: "en", extra: true })).toBeNull();
  });
});
