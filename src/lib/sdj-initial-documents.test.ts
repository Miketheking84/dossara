import { describe, expect, it } from "vitest";
import {
  escapeMarkdownTableCell,
  INITIAL_DOCUMENT_ALLOWED_EXTENSIONS,
  INITIAL_DOCUMENT_MAX_FILE_COUNT,
  INITIAL_DOCUMENT_MAX_FILE_NAME_LENGTH,
  INITIAL_DOCUMENT_MAX_FILE_SIZE_BYTES,
  INITIAL_DOCUMENT_MAX_TOTAL_SIZE_BYTES,
  validateInitialDocuments,
  type InitialDocumentMetadata,
  type InitialDocumentValidationErrorCode,
} from "./sdj-initial-documents";

function metadata(
  name: string,
  size = 1,
  mimeType?: string,
): InitialDocumentMetadata {
  return { name, size, ...(mimeType === undefined ? {} : { mimeType }) };
}

function errorCodes(documents: readonly InitialDocumentMetadata[]) {
  const result = validateInitialDocuments(documents);
  expect(result.valid).toBe(false);
  return result.valid
    ? []
    : result.errors.map(({ code }) => code);
}

function expectError(
  documents: readonly InitialDocumentMetadata[],
  code: InitialDocumentValidationErrorCode,
) {
  expect(errorCodes(documents)).toContain(code);
}

describe("validateInitialDocuments", () => {
  it.each(INITIAL_DOCUMENT_ALLOWED_EXTENSIONS)(
    "accepts the allowed %s extension",
    (extension) => {
      expect(validateInitialDocuments([metadata(`document${extension}`)]))
        .toMatchObject({ valid: true });
    },
  );

  it("accepts uppercase extensions and normalizes the extension", () => {
    const result = validateInitialDocuments([metadata("DOKUMENT.PDF")]);
    expect(result).toEqual({
      valid: true,
      errors: [],
      documents: [
        { name: "DOKUMENT.PDF", size: 1, extension: ".pdf" },
      ],
    });
  });

  it("accepts multiple valid files and preserves MIME as information", () => {
    const result = validateInitialDocuments([
      metadata("Ugovor final.docx", 20, "application/octet-stream"),
      metadata("Tabela.xlsx", 30),
      metadata("Fotografija.jpg", 40),
    ]);
    expect(result.valid).toBe(true);
    if (result.valid) {
      expect(result.documents).toHaveLength(3);
      expect(result.documents[0].mimeType).toBe("application/octet-stream");
    }
  });

  it("accepts spaces and Serbian diacritics", () => {
    expect(
      validateInitialDocuments([
        metadata("Činjenično stanje i žalba Željko.pdf"),
      ]).valid,
    ).toBe(true);
  });

  it("accepts one file exactly at the per-file limit", () => {
    expect(
      validateInitialDocuments([
        metadata("large.pdf", INITIAL_DOCUMENT_MAX_FILE_SIZE_BYTES),
      ]).valid,
    ).toBe(true);
  });

  it("accepts files exactly at the total-size limit", () => {
    const documents = Array.from({ length: 3 }, (_, index) =>
      metadata(
        `document-${index}.pdf`,
        INITIAL_DOCUMENT_MAX_TOTAL_SIZE_BYTES / 3,
      ),
    );
    expect(validateInitialDocuments(documents).valid).toBe(true);
  });

  it("accepts exactly the maximum number of files", () => {
    const documents = Array.from(
      { length: INITIAL_DOCUMENT_MAX_FILE_COUNT },
      (_, index) => metadata(`${index}.pdf`),
    );
    expect(validateInitialDocuments(documents).valid).toBe(true);
  });

  it("accepts a 150-character file name", () => {
    const name = `${"a".repeat(
      INITIAL_DOCUMENT_MAX_FILE_NAME_LENGTH - ".pdf".length,
    )}.pdf`;
    expect(name).toHaveLength(INITIAL_DOCUMENT_MAX_FILE_NAME_LENGTH);
    expect(validateInitialDocuments([metadata(name)]).valid).toBe(true);
  });

  it("accepts a long NFD name that is within the limit after NFC", () => {
    const decomposedName = `${"e\u0301".repeat(
      INITIAL_DOCUMENT_MAX_FILE_NAME_LENGTH - ".pdf".length,
    )}.pdf`;
    expect(decomposedName.length).toBeGreaterThan(
      INITIAL_DOCUMENT_MAX_FILE_NAME_LENGTH,
    );
    const result = validateInitialDocuments([metadata(decomposedName)]);
    expect(result.valid).toBe(true);
    if (result.valid) {
      expect(result.documents[0].name).toBe(decomposedName.normalize("NFC"));
      expect(result.documents[0].name).toHaveLength(
        INITIAL_DOCUMENT_MAX_FILE_NAME_LENGTH,
      );
    }
  });

  it("does not mutate the input array or its objects", () => {
    const document = metadata("C\u0301irilica.pdf", 12, "application/pdf");
    const documents = [document];
    const originalName = document.name;

    validateInitialDocuments(documents);

    expect(documents).toEqual([document]);
    expect(documents[0]).toBe(document);
    expect(document).toEqual({
      name: originalName,
      size: 12,
      mimeType: "application/pdf",
    });
  });

  it("preserves document order in normalized results", () => {
    const result = validateInitialDocuments([
      metadata("treći.pdf"),
      metadata("prvi.docx"),
      metadata("drugi.txt"),
    ]);
    expect(result.valid).toBe(true);
    if (result.valid) {
      expect(result.documents.map(({ name }) => name)).toEqual([
        "treći.pdf",
        "prvi.docx",
        "drugi.txt",
      ]);
    }
  });

  it.each(["COM10.pdf", "LPT10.txt", "CONSTRUCTION.pdf"])(
    "accepts the legitimate Windows name %s",
    (name) => {
      expect(validateInitialDocuments([metadata(name)]).valid).toBe(true);
    },
  );

  it("allows multiple extensions under the extension-only V1.0.1 policy", () => {
    expect(validateInitialDocuments([metadata("virus.exe.pdf")])).toMatchObject({
      valid: true,
    });
  });

  it("rejects more than the maximum number of files", () => {
    const documents = Array.from(
      { length: INITIAL_DOCUMENT_MAX_FILE_COUNT + 1 },
      (_, index) => metadata(`${index}.pdf`),
    );
    expectError(documents, "TOO_MANY_FILES");
  });

  it("rejects an empty file name", () => {
    expectError([metadata("")], "EMPTY_FILE_NAME");
  });

  it("rejects a hidden name made only of an allowed extension", () => {
    expectError([metadata(".pdf")], "EXTENSION_NOT_ALLOWED");
  });

  it("rejects an empty file", () => {
    expectError([metadata("empty.pdf", 0)], "EMPTY_FILE");
  });

  it.each([-1, Number.NaN, Number.POSITIVE_INFINITY, 1.5])(
    "rejects the invalid size %s",
    (size) => {
      expectError([metadata("document.pdf", size)], "INVALID_FILE_SIZE");
    },
  );

  it("rejects a file over the per-file limit", () => {
    expectError(
      [metadata("large.pdf", INITIAL_DOCUMENT_MAX_FILE_SIZE_BYTES + 1)],
      "FILE_TOO_LARGE",
    );
  });

  it("rejects files over the total-size limit", () => {
    const quarterLimit = INITIAL_DOCUMENT_MAX_TOTAL_SIZE_BYTES / 4;
    const documents = Array.from({ length: 4 }, (_, index) =>
      metadata(
        `document-${index}.pdf`,
        quarterLimit + (index === 3 ? 1 : 0),
      ),
    );
    expect(
      documents.reduce((total, document) => total + document.size, 0),
    ).toBe(INITIAL_DOCUMENT_MAX_TOTAL_SIZE_BYTES + 1);
    expectError(documents, "TOTAL_SIZE_TOO_LARGE");
  });

  it.each([
    "document",
    "document.exe",
    "document.js",
    "document.bat",
    "document.cmd",
    "document.ps1",
    "document.docm",
    "document.xlsm",
  ])("rejects a missing or forbidden extension: %s", (name) => {
    expectError([metadata(name)], "EXTENSION_NOT_ALLOWED");
  });

  it.each([
    "../document.pdf",
    "folder/../document.pdf",
  ])("rejects traversal names: %s", (name) => {
    expectError([metadata(name)], "UNSAFE_FILE_NAME");
  });

  it.each([
    "folder/document.pdf",
    "folder\\document.pdf",
    "document.pdf:stream",
    "C:\\document.pdf",
    "\\\\server\\share\\document.pdf",
    "document.pdf.",
    "document.pdf ",
    "document\u0000.pdf",
    "document\u001f.pdf",
  ])("rejects an unsafe name: %s", (name) => {
    expectError([metadata(name)], "UNSAFE_FILE_NAME");
  });

  it("rejects an overlong file name", () => {
    const extension = ".pdf";
    const name =
      "a".repeat(INITIAL_DOCUMENT_MAX_FILE_NAME_LENGTH - extension.length + 1) +
      extension;
    expect(name).toHaveLength(INITIAL_DOCUMENT_MAX_FILE_NAME_LENGTH + 1);
    expectError([metadata(name)], "FILE_NAME_TOO_LONG");
  });

  it.each([
    "CON",
    "PRN",
    "AUX",
    "NUL",
    ...Array.from({ length: 9 }, (_, index) => `COM${index + 1}`),
    ...Array.from({ length: 9 }, (_, index) => `LPT${index + 1}`),
  ])("rejects the Windows reserved name %s", (name) => {
    expectError([metadata(`${name}.pdf`)], "WINDOWS_RESERVED_NAME");
  });

  it("rejects a Windows reserved name without an extension", () => {
    expectError([metadata("CON")], "WINDOWS_RESERVED_NAME");
  });

  it("rejects a case-variant Windows reserved name", () => {
    expectError([metadata("con.PDF")], "WINDOWS_RESERVED_NAME");
  });

  it("rejects an exact duplicate", () => {
    expectError(
      [metadata("Ugovor.pdf"), metadata("Ugovor.pdf")],
      "DUPLICATE_FILE_NAME",
    );
  });

  it("rejects a case-insensitive duplicate", () => {
    expectError(
      [metadata("Ugovor.pdf"), metadata("UGOVOR.PDF")],
      "DUPLICATE_FILE_NAME",
    );
  });

  it("rejects a Unicode-normalized duplicate", () => {
    expectError(
      [metadata("Ćirilica.pdf"), metadata("C\u0301irilica.pdf")],
      "DUPLICATE_FILE_NAME",
    );
  });

  it("does not expose names, paths, raw errors, or user content in errors", () => {
    const secretInput = "C:\\private\\client-secret.exe";
    const result = validateInitialDocuments([metadata(secretInput)]);
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.errors.length).toBeGreaterThan(0);
      for (const error of result.errors) {
        expect(Object.keys(error).every((key) =>
          key === "code" || key === "fileIndex",
        )).toBe(true);
      }
      expect(JSON.stringify(result.errors)).not.toContain("client-secret");
      expect(JSON.stringify(result.errors)).not.toContain("C:\\private");
    }
  });
});

describe("escapeMarkdownTableCell", () => {
  it.each([
    ["a|b", "a&#124;b"],
    ["a\\|b", "a\\&#124;b"],
    ["a\\b", "a\\b"],
    ["a\\\\\\|b", "a\\\\\\&#124;b"],
    ["a\rb", "a<br>b"],
    ["a\nb", "a<br>b"],
    ["a\r\nb", "a<br>b"],
  ])("safely escapes the Markdown table cell %#", (input, expected) => {
    expect(escapeMarkdownTableCell(input)).toBe(expected);
  });

  it("does not modify ordinary text", () => {
    expect(escapeMarkdownTableCell("Ugovor sa dijakriticima: čćžšđ"))
      .toBe("Ugovor sa dijakriticima: čćžšđ");
  });
});
