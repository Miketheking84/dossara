import { describe, expect, it } from "vitest";
import { BRAND } from "./config";

describe("BRAND", () => {
  it("provides the active public display and metadata values from one config", () => {
    expect(BRAND).toMatchObject({
      productName: "DOSSARA",
      editionName: "DOSSARA Office",
      tagline: "Private, file-first Legal Command Center",
      shortMark: "DO",
      applicationTitle: "DOSSARA Office",
      metadataDescription: "Private, file-first Legal Command Center",
    });
  });
});
