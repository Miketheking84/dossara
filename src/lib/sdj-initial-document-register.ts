import {
  escapeMarkdownTableCell,
  INITIAL_DOCUMENT_ALLOWED_EXTENSIONS,
  type NormalizedInitialDocumentMetadata,
} from "./sdj-initial-documents";

export const INITIAL_DOCUMENT_REGISTER_FOLDER =
  "01 ULAZ/00 INITIAL INTAKE" as const;
export const INITIAL_DOCUMENT_REGISTER_NOTE =
  "Početna dokumentacija" as const;

export type InitialDocumentRegisterExtension =
  NormalizedInitialDocumentMetadata["extension"];

export type InitialDocumentRegisterMetadata = Readonly<{
  normalizedName: string;
  extension: InitialDocumentRegisterExtension;
}>;

export type InitialDocumentRegisterError =
  | "INVALID_OPENING_DATE"
  | "INVALID_DOCUMENT_METADATA";

export type InitialDocumentRegisterRowsResult =
  | Readonly<{
      ok: true;
      rows: readonly string[];
    }>
  | Readonly<{
      ok: false;
      error: InitialDocumentRegisterError;
    }>;

const ALLOWED_EXTENSION_SET = new Set<string>(
  INITIAL_DOCUMENT_ALLOWED_EXTENSIONS,
);
const EXTENSION_FORMAT = /^\.[a-z0-9]+$/;

function isLeapYear(year: number) {
  return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
}

function isValidOpeningDate(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) {
    return false;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const daysInMonth = [
    31,
    isLeapYear(year) ? 29 : 28,
    31,
    30,
    31,
    30,
    31,
    31,
    30,
    31,
    30,
    31,
  ];

  return (
    year >= 1 &&
    month >= 1 &&
    month <= 12 &&
    day >= 1 &&
    day <= daysInMonth[month - 1]
  );
}

function isValidMetadata(
  document: InitialDocumentRegisterMetadata,
): boolean {
  if (
    typeof document.normalizedName !== "string" ||
    typeof document.extension !== "string"
  ) {
    return false;
  }

  const extensionIndex = document.normalizedName.lastIndexOf(".");
  const nameExtension =
    extensionIndex > 0
      ? document.normalizedName
          .slice(extensionIndex)
          .toLocaleLowerCase("en-US")
      : "";

  return (
    document.normalizedName.trim().length > 0 &&
    !/[\u0000-\u001f\u007f]/.test(document.normalizedName) &&
    EXTENSION_FORMAT.test(document.extension) &&
    ALLOWED_EXTENSION_SET.has(document.extension) &&
    nameExtension === document.extension
  );
}

export function buildInitialDocumentRegisterRows(
  openingDate: string,
  documents: readonly InitialDocumentRegisterMetadata[],
): InitialDocumentRegisterRowsResult {
  if (!isValidOpeningDate(openingDate)) {
    return { ok: false, error: "INVALID_OPENING_DATE" };
  }

  if (!documents.every(isValidMetadata)) {
    return { ok: false, error: "INVALID_DOCUMENT_METADATA" };
  }

  const rows = documents.map((document, index) => {
    const cells = [
      String(index + 1),
      document.normalizedName,
      openingDate,
      document.extension.slice(1).toUpperCase(),
      INITIAL_DOCUMENT_REGISTER_FOLDER,
      INITIAL_DOCUMENT_REGISTER_NOTE,
    ].map(escapeMarkdownTableCell);

    return `| ${cells.join(" | ")} |`;
  });

  return { ok: true, rows };
}
