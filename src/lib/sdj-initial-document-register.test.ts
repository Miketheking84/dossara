import { describe, expect, it } from "vitest";
import {
  buildInitialDocumentRegisterRows,
  INITIAL_DOCUMENT_REGISTER_FOLDER,
  INITIAL_DOCUMENT_REGISTER_NOTE,
  type InitialDocumentRegisterExtension,
  type InitialDocumentRegisterMetadata,
} from "./sdj-initial-document-register";

function metadata(
  normalizedName: string,
  extension: string,
): InitialDocumentRegisterMetadata {
  return {
    normalizedName,
    extension: extension as InitialDocumentRegisterExtension,
  };
}

function expectRows(
  openingDate: string,
  documents: readonly InitialDocumentRegisterMetadata[],
) {
  const result = buildInitialDocumentRegisterRows(openingDate, documents);
  expect(result.ok).toBe(true);
  return result.ok ? result.rows : [];
}

function expectError(
  openingDate: string,
  documents: readonly InitialDocumentRegisterMetadata[],
  error: "INVALID_OPENING_DATE" | "INVALID_DOCUMENT_METADATA",
) {
  expect(buildInitialDocumentRegisterRows(openingDate, documents)).toEqual({
    ok: false,
    error,
  });
}

describe("buildInitialDocumentRegisterRows", () => {
  it("returns no rows for an empty valid document list", () => {
    expect(buildInitialDocumentRegisterRows("2026-07-27", [])).toEqual({
      ok: true,
      rows: [],
    });
  });

  it("builds the exact row for one PDF document", () => {
    expect(
      expectRows("2026-07-27", [metadata("naziv.pdf", ".pdf")]),
    ).toEqual([
      "| 1 | naziv.pdf | 2026-07-27 | PDF | 01 ULAZ/00 INITIAL INTAKE | Početna dokumentacija |",
    ]);
  });

  it.each([
    ["a.pdf", ".pdf"],
    ["a.PDF", ".pdf"],
    ["ugovor.final.pdf", ".pdf"],
  ])(
    "accepts a matching normalized name and extension: %s + %s",
    (normalizedName, extension) => {
      expect(
        buildInitialDocumentRegisterRows("2026-07-27", [
          metadata(normalizedName, extension),
        ]),
      ).toMatchObject({ ok: true });
    },
  );

  it.each([
    ["a.pdf", ".docx"],
    ["a", ".pdf"],
  ])(
    "rejects an inconsistent normalized name and extension: %s + %s",
    (normalizedName, extension) => {
      expectError(
        "2026-07-27",
        [metadata(normalizedName, extension)],
        "INVALID_DOCUMENT_METADATA",
      );
    },
  );

  it("preserves document order", () => {
    expect(
      expectRows("2026-07-27", [
        metadata("prvi.pdf", ".pdf"),
        metadata("drugi.docx", ".docx"),
        metadata("treci.txt", ".txt"),
      ]).map((row) => row.split(" | ")[1]),
    ).toEqual(["prvi.pdf", "drugi.docx", "treci.txt"]);
  });

  it("numbers rows from one without gaps", () => {
    expect(
      expectRows("2026-07-27", [
        metadata("a.pdf", ".pdf"),
        metadata("b.pdf", ".pdf"),
        metadata("c.pdf", ".pdf"),
      ]).map((row) => row.split(" | ")[0]),
    ).toEqual(["| 1", "| 2", "| 3"]);
  });

  it("uses the opening date in every row", () => {
    const rows = expectRows("2026-12-31", [
      metadata("a.pdf", ".pdf"),
      metadata("b.pdf", ".pdf"),
    ]);
    expect(rows.every((row) => row.includes("| 2026-12-31 |"))).toBe(true);
  });

  it.each([
    [".pdf", "PDF"],
    [".docx", "DOCX"],
    [".xlsx", "XLSX"],
    [".txt", "TXT"],
    [".jpg", "JPG"],
    [".jpeg", "JPEG"],
    [".png", "PNG"],
  ])("renders the %s extension as the %s type", (extension, type) => {
    const rows = expectRows("2026-07-27", [
      metadata(`document${extension}`, extension),
    ]);
    expect(rows[0]).toContain(`| ${type} |`);
  });

  it("uses the exact register folder and note constants", () => {
    expect(INITIAL_DOCUMENT_REGISTER_FOLDER).toBe(
      "01 ULAZ/00 INITIAL INTAKE",
    );
    expect(INITIAL_DOCUMENT_REGISTER_NOTE).toBe("Početna dokumentacija");
  });

  it("preserves Serbian diacritics", () => {
    expect(
      expectRows("2026-07-27", [
        metadata("Početni izvještaj žrtve.pdf", ".pdf"),
      ])[0],
    ).toContain("Početni izvještaj žrtve.pdf");
  });

  it("escapes a pipe in a document name as an HTML entity", () => {
    const row = expectRows("2026-07-27", [
      metadata("a|b.pdf", ".pdf"),
    ])[0];
    expect(row).toContain("a&#124;b.pdf");
    expect(row).not.toContain("a|b.pdf");
  });

  it("safely escapes a backslash followed by a pipe without adding a cell", () => {
    const row = expectRows("2026-07-27", [
      metadata("a\\|b.pdf", ".pdf"),
    ])[0];
    expect(row).toContain("a\\&#124;b.pdf");
    expect(row).not.toContain("a\\|b.pdf");
    expect(row.split("|").slice(1, -1)).toHaveLength(6);
  });

  it("keeps exactly six Markdown cells after escaping a pipe", () => {
    const row = expectRows("2026-07-27", [
      metadata("a|b.pdf", ".pdf"),
    ])[0];
    expect(row.split("|").slice(1, -1)).toHaveLength(6);
  });

  it("does not mutate the input array or metadata objects", () => {
    const first = metadata("a.pdf", ".pdf");
    const second = metadata("b.docx", ".docx");
    const documents = [first, second] as const;
    const snapshot = JSON.stringify(documents);

    buildInitialDocumentRegisterRows("2026-07-27", documents);

    expect(JSON.stringify(documents)).toBe(snapshot);
    expect(documents[0]).toBe(first);
    expect(documents[1]).toBe(second);
  });

  it("is deterministic for identical inputs", () => {
    const documents = [
      metadata("a.pdf", ".pdf"),
      metadata("b.docx", ".docx"),
    ];
    expect(buildInitialDocumentRegisterRows("2026-07-27", documents)).toEqual(
      buildInitialDocumentRegisterRows("2026-07-27", documents),
    );
  });

  it("accepts a valid leap day", () => {
    expect(
      buildInitialDocumentRegisterRows("2024-02-29", [
        metadata("a.pdf", ".pdf"),
      ]),
    ).toMatchObject({ ok: true });
  });

  it.each(["2000-02-29", "2400-02-29"])(
    "accepts the Gregorian century leap date %s",
    (openingDate) => {
      expect(
        buildInitialDocumentRegisterRows(openingDate, [
          metadata("a.pdf", ".pdf"),
        ]),
      ).toMatchObject({ ok: true });
    },
  );

  it.each(["1900-02-29", "2100-02-29"])(
    "rejects the non-leap century date %s",
    (openingDate) => {
      expectError(
        openingDate,
        [metadata("a.pdf", ".pdf")],
        "INVALID_OPENING_DATE",
      );
    },
  );

  it.each([
    "2023-02-29",
    "2026-02-30",
    "2026-04-31",
    "2026-00-01",
    "2026-13-01",
    "2026-01-00",
    "2026-01-32",
  ])("rejects the impossible calendar date %s", (openingDate) => {
    expectError(
      openingDate,
      [metadata("a.pdf", ".pdf")],
      "INVALID_OPENING_DATE",
    );
  });

  it.each([
    "",
    "27-07-2026",
    "2026-7-27",
    "2026-07-27 ",
    " 2026-07-27",
    "2026-07-27T00:00:00Z",
    "0000-01-01",
  ])("rejects the malformed opening date %j", (openingDate) => {
    expectError(
      openingDate,
      [metadata("a.pdf", ".pdf")],
      "INVALID_OPENING_DATE",
    );
  });

  it.each([
    ["an empty normalized name", metadata("", ".pdf")],
    ["a carriage return in the name", metadata("a\rb.pdf", ".pdf")],
    ["a line feed in the name", metadata("a\nb.pdf", ".pdf")],
    ["a CRLF sequence in the name", metadata("a\r\nb.pdf", ".pdf")],
    ["a whitespace-only normalized name", metadata("   ", ".pdf")],
    ["an ASCII control character", metadata("a\u0007b.pdf", ".pdf")],
    ["a filename without an extension", metadata("document", ".pdf")],
    ["an empty extension", metadata("a.pdf", "")],
    ["an extension without a dot", metadata("a.pdf", "pdf")],
    ["an uppercase extension", metadata("a.PDF", ".PDF")],
    ["an unknown extension", metadata("a.exe", ".exe")],
  ])("rejects metadata with %s", (_scenario, document) => {
    expectError(
      "2026-07-27",
      [document],
      "INVALID_DOCUMENT_METADATA",
    );
  });

  it("returns a controlled metadata error without document content", () => {
    const privateName = "povjerljivo|ime.exe";
    const result = buildInitialDocumentRegisterRows("2026-07-27", [
      metadata(privateName, ".exe"),
    ]);
    expect(result).toEqual({
      ok: false,
      error: "INVALID_DOCUMENT_METADATA",
    });
    expect(JSON.stringify(result)).not.toContain(privateName);
  });

  it("creates exactly six Markdown table cells", () => {
    const row = expectRows("2026-07-27", [
      metadata("a.pdf", ".pdf"),
    ])[0];
    expect(row.split("|").slice(1, -1)).toHaveLength(6);
  });

  it("does not add absolute paths or backslashes", () => {
    const row = expectRows("2026-07-27", [
      metadata("a.pdf", ".pdf"),
    ])[0];
    expect(row).not.toMatch(/[A-Za-z]:\\/);
    expect(row).not.toContain("\\");
  });

  it("does not add line breaks or an extra trailing cell", () => {
    const row = expectRows("2026-07-27", [
      metadata("a.pdf", ".pdf"),
    ])[0];
    expect(row).not.toMatch(/[\r\n]/);
    expect(row.endsWith(" |")).toBe(true);
    expect(row.endsWith(" | |")).toBe(false);
  });

  it("does not create a false row for an empty list", () => {
    const rows = expectRows("2026-07-27", []);
    expect(rows).toHaveLength(0);
    expect(rows.join("\n")).toBe("");
  });
});
