import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/sdj-workspace", () => ({
  getActiveWorkspaceRoot: vi.fn(),
  getClientsRoot: vi.fn(),
}));

import {
  isMatterType,
  MATTER_TYPES,
} from "./sdj-matter-classification";
import { parseMatterCommandCenter } from "./sdj-matters";

const APPROVED_MATTER_TYPES = [
  "Parnični spor",
  "Privredni spor",
  "Radni spor",
  "Upravni spor",
  "Izvršni postupak",
  "Vanparnični postupak",
  "Krivični postupak",
  "Prekršajni postupak",
  "Arbitraža",
  "Medijacija / mirenje",
  "Ugovorni predmet",
  "Pravna usklađenost",
  "Pravno savjetovanje",
  "Drugo",
] as const;

describe("MTC-1 matter type vocabulary", () => {
  it("contains exactly the 14 approved values in stable order", () => {
    expect(MATTER_TYPES).toEqual(APPROVED_MATTER_TYPES);
  });

  it.each(APPROVED_MATTER_TYPES)("accepts the approved value %s", (value) => {
    expect(isMatterType(value)).toBe(true);
  });

  it("rejects a new value outside the approved vocabulary", () => {
    expect(isMatterType("Nasljedno pravo")).toBe(false);
    expect(isMatterType("drugo")).toBe(false);
    expect(isMatterType("")).toBe(false);
  });
});

describe("MTC-1 command-center read compatibility", () => {
  it("returns a stored approved matter type through the parser/read model", () => {
    const result = parseMatterCommandCenter(
      "Klijent: Test\nPredmet: Primjer\nVrsta predmeta: Radni spor\nStatus: Aktivan\n",
    );

    expect(result.metadata.matterType).toBe("Radni spor");
  });

  it("keeps a missing matter type missing instead of defaulting to Drugo", () => {
    const result = parseMatterCommandCenter(
      "Klijent: Test\nPredmet: Legacy predmet\nStatus: Aktivan\n",
    );

    expect(result.metadata.matterType).toBeNull();
  });

  it("preserves an unknown legacy value without coercing it to Drugo", () => {
    const result = parseMatterCommandCenter(
      "Klijent: Test\nPredmet: Legacy predmet\nVrsta predmeta: Nasljedno pravo\nStatus: Aktivan\n",
    );

    expect(result.metadata.matterType).toBe("Nasljedno pravo");
    expect(result.metadata.matterType).not.toBe("Drugo");
  });
});
