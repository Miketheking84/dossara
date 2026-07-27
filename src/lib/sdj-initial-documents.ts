export const INITIAL_DOCUMENT_ALLOWED_EXTENSIONS = [
  ".pdf",
  ".docx",
  ".xlsx",
  ".txt",
  ".jpg",
  ".jpeg",
  ".png",
] as const;

export const INITIAL_DOCUMENT_MAX_FILE_COUNT = 10;
export const INITIAL_DOCUMENT_MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024;
export const INITIAL_DOCUMENT_MAX_TOTAL_SIZE_BYTES = 75 * 1024 * 1024;
export const INITIAL_DOCUMENT_MAX_FILE_NAME_LENGTH = 150;

export type InitialDocumentMetadata = {
  name: string;
  size: number;
  mimeType?: string;
};

export type NormalizedInitialDocumentMetadata = {
  name: string;
  size: number;
  mimeType?: string;
  extension: (typeof INITIAL_DOCUMENT_ALLOWED_EXTENSIONS)[number];
};

export const INITIAL_DOCUMENT_VALIDATION_ERROR_CODES = [
  "TOO_MANY_FILES",
  "EMPTY_FILE_NAME",
  "INVALID_FILE_SIZE",
  "EMPTY_FILE",
  "FILE_TOO_LARGE",
  "TOTAL_SIZE_TOO_LARGE",
  "EXTENSION_NOT_ALLOWED",
  "FILE_NAME_TOO_LONG",
  "UNSAFE_FILE_NAME",
  "WINDOWS_RESERVED_NAME",
  "DUPLICATE_FILE_NAME",
] as const;

export type InitialDocumentValidationErrorCode =
  (typeof INITIAL_DOCUMENT_VALIDATION_ERROR_CODES)[number];

export type InitialDocumentValidationError = {
  code: InitialDocumentValidationErrorCode;
  fileIndex?: number;
};

export type InitialDocumentValidationResult =
  | {
      valid: true;
      errors: [];
      documents: NormalizedInitialDocumentMetadata[];
    }
  | {
      valid: false;
      errors: InitialDocumentValidationError[];
      documents?: never;
    };

const ALLOWED_EXTENSION_SET = new Set<string>(
  INITIAL_DOCUMENT_ALLOWED_EXTENSIONS,
);
const WINDOWS_RESERVED_NAME =
  /^(?:CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])$/i;
const CONTROL_CHARACTER = /[\u0000-\u001f\u007f]/;
const DRIVE_ABSOLUTE_PATH = /^[a-z]:[\\/]/i;

function extensionOf(name: string) {
  const dotIndex = name.lastIndexOf(".");
  return dotIndex > 0 ? name.slice(dotIndex).toLocaleLowerCase("en-US") : "";
}

function isWindowsReservedName(name: string) {
  const baseName = name.split(".", 1)[0];
  return WINDOWS_RESERVED_NAME.test(baseName);
}

function isUnsafeFileName(name: string) {
  return (
    name.includes("/") ||
    name.includes("\\") ||
    name.includes(":") ||
    name.includes("..") ||
    CONTROL_CHARACTER.test(name) ||
    DRIVE_ABSOLUTE_PATH.test(name) ||
    name.startsWith("\\\\") ||
    name.endsWith(".") ||
    name.endsWith(" ")
  );
}

function duplicateKey(name: string) {
  return name.toLocaleLowerCase("en-US");
}

function errorFor(
  code: InitialDocumentValidationErrorCode,
  fileIndex?: number,
): InitialDocumentValidationError {
  return {
    code,
    ...(fileIndex === undefined ? {} : { fileIndex }),
  };
}

export function validateInitialDocuments(
  documents: readonly InitialDocumentMetadata[],
): InitialDocumentValidationResult {
  const errors: InitialDocumentValidationError[] = [];
  const normalizedDocuments: NormalizedInitialDocumentMetadata[] = [];
  const seenNames = new Set<string>();
  let totalSize = 0;

  if (documents.length > INITIAL_DOCUMENT_MAX_FILE_COUNT) {
    errors.push(errorFor("TOO_MANY_FILES"));
  }

  documents.forEach((document, fileIndex) => {
    const { name: originalName, size, mimeType } = document;
    const normalizedName = originalName.normalize("NFC");

    if (normalizedName.length === 0) {
      errors.push(errorFor("EMPTY_FILE_NAME", fileIndex));
    } else {
      if (normalizedName.length > INITIAL_DOCUMENT_MAX_FILE_NAME_LENGTH) {
        errors.push(errorFor("FILE_NAME_TOO_LONG", fileIndex));
      }
      if (isUnsafeFileName(normalizedName)) {
        errors.push(errorFor("UNSAFE_FILE_NAME", fileIndex));
      }
      if (isWindowsReservedName(normalizedName)) {
        errors.push(errorFor("WINDOWS_RESERVED_NAME", fileIndex));
      }

      const nameKey = duplicateKey(normalizedName);
      if (seenNames.has(nameKey)) {
        errors.push(errorFor("DUPLICATE_FILE_NAME", fileIndex));
      } else {
        seenNames.add(nameKey);
      }
    }

    const validSize =
      Number.isFinite(size) && Number.isInteger(size) && size >= 0;
    if (!validSize) {
      errors.push(errorFor("INVALID_FILE_SIZE", fileIndex));
    } else {
      totalSize += size;
      if (size === 0) {
        errors.push(errorFor("EMPTY_FILE", fileIndex));
      } else if (size > INITIAL_DOCUMENT_MAX_FILE_SIZE_BYTES) {
        errors.push(errorFor("FILE_TOO_LARGE", fileIndex));
      }
    }

    const extension = extensionOf(normalizedName);
    if (!ALLOWED_EXTENSION_SET.has(extension)) {
      errors.push(errorFor("EXTENSION_NOT_ALLOWED", fileIndex));
      return;
    }

    normalizedDocuments.push({
      name: normalizedName,
      size,
      ...(mimeType === undefined ? {} : { mimeType }),
      extension:
        extension as NormalizedInitialDocumentMetadata["extension"],
    });
  });

  if (totalSize > INITIAL_DOCUMENT_MAX_TOTAL_SIZE_BYTES) {
    errors.push(errorFor("TOTAL_SIZE_TOO_LARGE"));
  }

  return errors.length > 0
    ? { valid: false, errors }
    : { valid: true, errors: [], documents: normalizedDocuments };
}

export function escapeMarkdownTableCell(value: string) {
  return value.replace(/\r\n|\r|\n/g, "<br>").replace(/\|/g, "&#124;");
}
