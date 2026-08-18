import { randomUUID as nodeRandomUUID } from "node:crypto";
import {
  mkdir as nodeMkdir,
  rename as nodeRename,
  rm as nodeRm,
  stat as nodeStat,
  writeFile as nodeWriteFile,
} from "node:fs/promises";
import path from "node:path";
import {
  buildInitialDocumentRegisterRows,
  type InitialDocumentRegisterRowsResult,
} from "../../../lib/sdj-initial-document-register";
import {
  storeInitialDocumentsInStaging,
  type InitialDocumentStorageResult,
} from "../../../lib/sdj-initial-document-storage";
import {
  CONTROL_FILES,
  isSafeDirectChild,
  markdownValue,
  MATTER_FOLDERS,
} from "../../../lib/sdj-files";
import type { MatterInput, ValidatedInitialDocument } from "./matter-request";

const STAGING_FOLDER_NAME =
  /^\.sdj-mike-staging-[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export type MatterCreateTransactionError =
  | "MATTER_ALREADY_EXISTS"
  | "MATTER_CHECK_FAILED"
  | "STORAGE_FAILED"
  | "REGISTER_FAILED"
  | "CONTROL_WRITE_FAILED"
  | "RENAME_FAILED"
  | "INVALID_TRANSACTION_STRUCTURE";

export type MatterCreateTransactionResult =
  | Readonly<{
      ok: true;
      initialDocumentsSaved: number;
    }>
  | Readonly<{
      ok: false;
      error: MatterCreateTransactionError;
      collision: boolean;
      cleanupFailed: boolean;
    }>;

export type MatterCreateTransactionInput = Readonly<{
  realClientPath: string;
  matterPath: string;
  matterFolder: string;
  controlInput: MatterInput;
  initialDocuments: readonly ValidatedInitialDocument[];
}>;

type ControlWriteOptions = Readonly<{
  encoding: "utf8";
  flag: "wx";
}>;

export type MatterCreateDependencies = Readonly<{
  randomUUID(): string;
  exists(candidate: string): Promise<boolean>;
  mkdir(candidate: string): Promise<unknown>;
  writeFile(
    destination: string,
    content: string,
    options: ControlWriteOptions,
  ): Promise<unknown>;
  rename(source: string, destination: string): Promise<unknown>;
  rm(
    candidate: string,
    options: Readonly<{ recursive: true; force: true }>,
  ): Promise<unknown>;
  storeInitialDocuments(
    input: Readonly<{
      stagingMatterPath: string;
      documents: readonly ValidatedInitialDocument[];
    }>,
  ): Promise<InitialDocumentStorageResult>;
  buildInitialDocumentRegisterRows(
    openingDate: string,
    documents: readonly ValidatedInitialDocument[],
  ): InitialDocumentRegisterRowsResult;
}>;

const DEFAULT_DEPENDENCIES: MatterCreateDependencies = {
  randomUUID: nodeRandomUUID,
  exists: async (candidate) => {
    try {
      await nodeStat(candidate);
      return true;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") {
        return false;
      }
      throw error;
    }
  },
  mkdir: nodeMkdir,
  writeFile: nodeWriteFile,
  rename: nodeRename,
  rm: nodeRm,
  storeInitialDocuments: storeInitialDocumentsInStaging,
  buildInitialDocumentRegisterRows,
};

class MatterCreateFailure extends Error {
  readonly transactionError: MatterCreateTransactionError;
  readonly collision: boolean;

  constructor(
    transactionError: MatterCreateTransactionError,
    collision = false,
  ) {
    super(transactionError);
    this.name = "MatterCreateFailure";
    this.transactionError = transactionError;
    this.collision = collision;
  }
}

function isRenameCollision(error: unknown) {
  const code = (error as NodeJS.ErrnoException).code;
  return code === "EEXIST" || code === "ENOTEMPTY";
}

function hasSafeTransactionStructure(
  realClientPath: string,
  matterPath: string,
  matterFolder: string,
) {
  return (
    path.win32.isAbsolute(realClientPath) &&
    path.win32.isAbsolute(matterPath) &&
    isSafeDirectChild(realClientPath, matterPath) &&
    path.win32.basename(matterPath) === matterFolder
  );
}

function isSafeStagingTarget(realClientPath: string, stagingPath: string) {
  return (
    isSafeDirectChild(realClientPath, stagingPath) &&
    STAGING_FOLDER_NAME.test(path.win32.basename(stagingPath))
  );
}

function controlContents(
  input: MatterInput,
  registerRows: readonly string[],
) {
  const v = markdownValue;
  const commandCenter = `# Command Center\n\nKlijent: ${v(input.client)}\nPredmet: ${v(input.matterName)}\nDatum otvaranja: ${v(input.openingDate)}\nStatus: ${v(input.status)}\nPrioritet: ${v(input.priority)}\nOblast prava: ${v(input.legalArea)}\nVrsta predmeta: ${v(input.matterType)}\nSledeći korak: ${v(input.nextStep)}\nČeka se od: ${v(input.waitingFrom)}\nDetalj čekanja / napomena: ${v(input.waitingDetail)}\nRok: ${v(input.deadline)}\nKratak opis: ${v(input.description)}\nKljučna pitanja:\nRizici:\nOčekivani output: ${v(input.expectedOutput)}\nStatus outputa:\nFinalni dokument:\nFinalni cilj:\n`;
  const actionSection =
    input.priority === "Hitno" || input.priority === "Visok"
      ? "Hitno"
      : "Ove nedelje";
  const nextActions = `# Next Actions\n\n## Hitno\n${actionSection === "Hitno" && input.nextStep ? `- ${v(input.nextStep)}` : "- "}\n\n## Ove nedelje\n${actionSection === "Ove nedelje" && input.nextStep ? `- ${v(input.nextStep)}` : "- "}\n\n## Čeka se od klijenta\n- \n\n## Čeka se od druge strane\n- \n\n## Potrebno proveriti\n- \n`;
  const documentRegisterHeader =
    "# Document Register\n\n| Br. | Dokument | Datum | Tip | Folder | Napomena |\n|---|---|---|---|---|---|\n";
  const documentRegister =
    registerRows.length === 0
      ? documentRegisterHeader
      : `${documentRegisterHeader}${registerRows.join("\n")}\n`;

  return {
    "command-center.md": commandCenter,
    "chronology.md":
      "# Chronology\n\n| Datum | Događaj | Dokument | Napomena |\n|---|---|---|---|\n",
    "next-actions.md": nextActions,
    "document-register.md": documentRegister,
    "ai-work-log.md":
      "# AI Work Log\n\n| Datum | Alat | Prompt tip | Sačuvano u | Rezultat / Napomena |\n|---|---|---|---|---|\n",
  } satisfies Record<(typeof CONTROL_FILES)[number], string>;
}

function failureResult(
  error: MatterCreateTransactionError,
  collision: boolean,
  cleanupFailed: boolean,
): MatterCreateTransactionResult {
  return { ok: false, error, collision, cleanupFailed };
}

/** @internal Test-only dependency injection entry point. */
export async function createMatterTransactionWithDependencies(
  input: MatterCreateTransactionInput,
  dependencies: MatterCreateDependencies,
): Promise<MatterCreateTransactionResult> {
  const {
    realClientPath,
    matterPath,
    matterFolder,
    controlInput,
    initialDocuments,
  } = input;

  if (
    !hasSafeTransactionStructure(realClientPath, matterPath, matterFolder)
  ) {
    return failureResult("INVALID_TRANSACTION_STRUCTURE", false, false);
  }

  try {
    if (await dependencies.exists(matterPath)) {
      return failureResult("MATTER_ALREADY_EXISTS", true, false);
    }
  } catch {
    return failureResult("MATTER_CHECK_FAILED", false, false);
  }

  let stagingPath: string;
  try {
    stagingPath = path.win32.join(
      realClientPath,
      `.sdj-mike-staging-${dependencies.randomUUID()}`,
    );
  } catch {
    return failureResult("INVALID_TRANSACTION_STRUCTURE", false, false);
  }

  if (!isSafeStagingTarget(realClientPath, stagingPath)) {
    return failureResult("INVALID_TRANSACTION_STRUCTURE", false, false);
  }

  let stagingCreated = false;
  let primaryFailure: MatterCreateFailure | null = null;

  try {
    await dependencies.mkdir(stagingPath);
    stagingCreated = true;

    for (const folder of MATTER_FOLDERS) {
      await dependencies.mkdir(path.win32.join(stagingPath, folder));
    }

    let storageResult: InitialDocumentStorageResult;
    try {
      storageResult = await dependencies.storeInitialDocuments({
        stagingMatterPath: stagingPath,
        documents: initialDocuments,
      });
    } catch {
      throw new MatterCreateFailure("STORAGE_FAILED");
    }
    if (!storageResult.ok) {
      throw new MatterCreateFailure("STORAGE_FAILED");
    }

    let registerResult: InitialDocumentRegisterRowsResult;
    try {
      registerResult = dependencies.buildInitialDocumentRegisterRows(
        controlInput.openingDate,
        initialDocuments,
      );
    } catch {
      throw new MatterCreateFailure("REGISTER_FAILED");
    }
    if (!registerResult.ok) {
      throw new MatterCreateFailure("REGISTER_FAILED");
    }

    const contents = controlContents(controlInput, registerResult.rows);
    try {
      for (const file of CONTROL_FILES) {
        await dependencies.writeFile(
          path.win32.join(stagingPath, "00 CONTROL", file),
          contents[file],
          { encoding: "utf8", flag: "wx" },
        );
      }
    } catch {
      throw new MatterCreateFailure("CONTROL_WRITE_FAILED");
    }

    try {
      if (await dependencies.exists(matterPath)) {
        throw new MatterCreateFailure("MATTER_ALREADY_EXISTS", true);
      }
    } catch (error) {
      if (error instanceof MatterCreateFailure) {
        throw error;
      }
      throw new MatterCreateFailure("INVALID_TRANSACTION_STRUCTURE");
    }

    if (
      !isSafeStagingTarget(realClientPath, stagingPath) ||
      !hasSafeTransactionStructure(
        realClientPath,
        matterPath,
        matterFolder,
      )
    ) {
      throw new MatterCreateFailure("INVALID_TRANSACTION_STRUCTURE");
    }

    try {
      await dependencies.rename(stagingPath, matterPath);
    } catch (error) {
      throw new MatterCreateFailure(
        isRenameCollision(error)
          ? "MATTER_ALREADY_EXISTS"
          : "RENAME_FAILED",
        isRenameCollision(error),
      );
    }

    stagingCreated = false;
    return {
      ok: true,
      initialDocumentsSaved: storageResult.savedCount,
    };
  } catch (error) {
    primaryFailure =
      error instanceof MatterCreateFailure
        ? error
        : new MatterCreateFailure("INVALID_TRANSACTION_STRUCTURE");
  }

  let cleanupFailed = false;
  if (stagingCreated) {
    if (!isSafeStagingTarget(realClientPath, stagingPath)) {
      cleanupFailed = true;
    } else {
      try {
        await dependencies.rm(stagingPath, {
          recursive: true,
          force: true,
        });
      } catch {
        cleanupFailed = true;
      }
    }
  }

  return failureResult(
    primaryFailure.transactionError,
    primaryFailure.collision,
    cleanupFailed,
  );
}

export async function createMatterTransaction(
  input: MatterCreateTransactionInput,
): Promise<MatterCreateTransactionResult> {
  return createMatterTransactionWithDependencies(input, DEFAULT_DEPENDENCIES);
}
