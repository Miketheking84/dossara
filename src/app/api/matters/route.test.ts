import {
  lstat,
  mkdir,
  mkdtemp,
  readFile,
  readdir,
  rename,
  rm,
  stat,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { buildInitialDocumentRegisterRows } from "../../../lib/sdj-initial-document-register";
import { storeInitialDocumentsInStaging } from "../../../lib/sdj-initial-document-storage";
import { CONTROL_FILES, MATTER_FOLDERS } from "../../../lib/sdj-files";
import {
  createMatterTransaction,
  createMatterTransactionWithDependencies,
  type MatterCreateDependencies,
  type MatterCreateTransactionInput,
} from "./matter-create";
import type {
  MatterInput,
  ValidatedInitialDocument,
} from "./matter-request";
import { parseMatterRequest } from "./matter-request";

const FIXED_UUID = "550e8400-e29b-41d4-a716-446655440000";
const LEGACY_DOCUMENT_REGISTER =
  "# Document Register\n\n| Br. | Dokument | Datum | Tip | Folder | Napomena |\n|---|---|---|---|---|---|\n";

const validControlInput: MatterInput = {
  client: "TEST_CLIENT",
  matterName: "Test matter",
  legalArea: "Ugovorno pravo",
  matterType: "Ugovorni predmet",
  status: "Aktivan",
  priority: "Srednji",
  description: "Opis",
  nextStep: "Pregled",
  deadline: "",
  waitingFrom: "Niko / nije primenljivo",
  waitingDetail: "",
  expectedOutput: "Mišljenje",
  openingDate: "2026-07-29",
  folderNameOverride: "",
};

const nodeDependencies: MatterCreateDependencies = {
  randomUUID: () => FIXED_UUID,
  exists: async (candidate) => {
    try {
      await stat(candidate);
      return true;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") {
        return false;
      }
      throw error;
    }
  },
  mkdir,
  writeFile,
  rename,
  rm,
  storeInitialDocuments: storeInitialDocumentsInStaging,
  buildInitialDocumentRegisterRows,
};

function dependenciesWith(
  overrides: Partial<MatterCreateDependencies> = {},
): MatterCreateDependencies {
  return { ...nodeDependencies, ...overrides };
}

function documentFor(
  content: string,
  normalizedName: string,
  extension = normalizedName.slice(normalizedName.lastIndexOf(".")),
): ValidatedInitialDocument {
  const file = new File([content], normalizedName);
  return {
    file,
    normalizedName,
    extension: extension.toLocaleLowerCase(
      "en-US",
    ) as ValidatedInitialDocument["extension"],
    size: file.size,
  };
}

async function pathExists(candidate: string) {
  try {
    await lstat(candidate);
    return true;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return false;
    }
    throw error;
  }
}

function errorWithCode(code: string, message = `private ${code} path`) {
  return Object.assign(new Error(message), { code });
}

describe("createMatterTransaction", () => {
  let tempRoot: string;
  let realClientPath: string;
  let matterFolder: string;
  let matterPath: string;
  let stagingPath: string;

  beforeEach(async () => {
    tempRoot = await mkdtemp(path.join(tmpdir(), "sdj-matter-route-"));
    realClientPath = path.join(tempRoot, "TEST_CLIENT");
    matterFolder = "SDJ_2026-07-29_TEST_CLIENT_TEST_MATTER";
    matterPath = path.join(realClientPath, matterFolder);
    stagingPath = path.join(
      realClientPath,
      `.sdj-mike-staging-${FIXED_UUID}`,
    );
    await mkdir(realClientPath);
  });

  afterEach(async () => {
    await rm(tempRoot, { recursive: true, force: true });
  });

  function transactionInput(
    initialDocuments: readonly ValidatedInitialDocument[] = [],
  ): MatterCreateTransactionInput {
    return {
      realClientPath,
      matterPath,
      matterFolder,
      controlInput: validControlInput,
      initialDocuments,
    };
  }

  async function run(
    initialDocuments: readonly ValidatedInitialDocument[] = [],
    overrides: Partial<MatterCreateDependencies> = {},
  ) {
    return createMatterTransactionWithDependencies(
      transactionInput(initialDocuments),
      dependenciesWith(overrides),
    );
  }

  it("connects a valid JSON parse result to a zero-document transaction", async () => {
    const parsed = await parseMatterRequest(
      new Request("http://localhost/api/matters", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validControlInput),
      }),
    );
    expect(parsed.ok).toBe(true);
    if (!parsed.ok || !parsed.input) {
      throw new Error("Expected valid JSON input.");
    }
    const storageSpy = vi.fn(nodeDependencies.storeInitialDocuments);

    const result = await createMatterTransactionWithDependencies(
      {
        ...transactionInput(parsed.initialDocuments),
        controlInput: parsed.input,
      },
      dependenciesWith({ storeInitialDocuments: storageSpy }),
    );

    expect(parsed.format).toBe("json");
    expect(result).toEqual({ ok: true, initialDocumentsSaved: 0 });
    expect(storageSpy.mock.calls[0]?.[0].documents).toBe(
      parsed.initialDocuments,
    );
  });

  it("connects metadata-only multipart to the legacy zero-document transaction", async () => {
    const formData = new FormData();
    for (const [field, value] of Object.entries(validControlInput)) {
      formData.append(field, value);
    }
    const parsed = await parseMatterRequest(
      new Request("http://localhost/api/matters", {
        method: "POST",
        body: formData,
      }),
    );
    expect(parsed.ok).toBe(true);
    if (!parsed.ok || !parsed.input) {
      throw new Error("Expected valid multipart input.");
    }

    const result = await createMatterTransactionWithDependencies(
      {
        ...transactionInput(parsed.initialDocuments),
        controlInput: parsed.input,
      },
      nodeDependencies,
    );

    expect(parsed.format).toBe("multipart");
    expect(result).toEqual({ ok: true, initialDocumentsSaved: 0 });
    expect(
      await pathExists(
        path.join(matterPath, "01 ULAZ", "00 INITIAL INTAKE"),
      ),
    ).toBe(false);
  });

  it("connects multipart Files to storage and register in parser order", async () => {
    const formData = new FormData();
    for (const [field, value] of Object.entries(validControlInput)) {
      formData.append(field, value);
    }
    formData.append(
      "initialDocuments",
      new File(["first"], "first.pdf"),
      "first.pdf",
    );
    formData.append(
      "initialDocuments",
      new File(["second"], "second.txt"),
      "second.txt",
    );
    const parsed = await parseMatterRequest(
      new Request("http://localhost/api/matters", {
        method: "POST",
        body: formData,
      }),
    );
    expect(parsed.ok).toBe(true);
    if (!parsed.ok || !parsed.input) {
      throw new Error("Expected valid multipart documents.");
    }

    const result = await createMatterTransactionWithDependencies(
      {
        ...transactionInput(parsed.initialDocuments),
        controlInput: parsed.input,
      },
      nodeDependencies,
    );
    const register = await readFile(
      path.join(matterPath, "00 CONTROL", "document-register.md"),
      "utf8",
    );

    expect(result).toEqual({ ok: true, initialDocumentsSaved: 2 });
    expect(register.indexOf("| 1 | first.pdf |")).toBeLessThan(
      register.indexOf("| 2 | second.txt |"),
    );
  });

  it("creates a JSON-equivalent matter with zero saved documents", async () => {
    const storageSpy = vi.fn(nodeDependencies.storeInitialDocuments);

    const result = await run([], { storeInitialDocuments: storageSpy });

    expect(result).toEqual({ ok: true, initialDocumentsSaved: 0 });
    expect(storageSpy).toHaveBeenCalledWith({
      stagingMatterPath: stagingPath,
      documents: [],
    });
    expect(await pathExists(matterPath)).toBe(true);
  });

  it("keeps the existing success information free of paths and metadata", async () => {
    const document = documentFor("private bytes", "private-client.pdf");

    const result = await run([document]);
    const serialized = JSON.stringify(result);

    expect(result).toEqual({ ok: true, initialDocumentsSaved: 1 });
    expect(serialized).not.toContain(tempRoot);
    expect(serialized).not.toContain(FIXED_UUID);
    expect(serialized).not.toContain(document.normalizedName);
    expect(serialized).not.toContain("01 ULAZ");
  });

  it("uses the production wrapper with real Node dependencies", async () => {
    const result = await createMatterTransaction(transactionInput());

    expect(result).toEqual({ ok: true, initialDocumentsSaved: 0 });
    expect(await pathExists(matterPath)).toBe(true);
  });

  it("creates all five matter folders", async () => {
    await run();

    for (const folder of MATTER_FOLDERS) {
      expect(await pathExists(path.join(matterPath, folder))).toBe(true);
    }
  });

  it("stores the selected matter type in the file-first command center", async () => {
    await run();

    const commandCenter = await readFile(
      path.join(matterPath, "00 CONTROL", "command-center.md"),
      "utf8",
    );
    expect(commandCenter).toContain("Vrsta predmeta: Ugovorni predmet");
  });

  it("writes every CONTROL file exactly once in stable order with wx", async () => {
    const calls: {
      destination: string;
      options: Readonly<{ encoding: "utf8"; flag: "wx" }>;
    }[] = [];
    const writeSpy = vi.fn(
      async (
        destination: string,
        content: string,
        options: Readonly<{ encoding: "utf8"; flag: "wx" }>,
      ) => {
        calls.push({ destination, options });
        await writeFile(destination, content, options);
      },
    );

    const result = await run([], { writeFile: writeSpy });

    expect(result.ok).toBe(true);
    expect(writeSpy).toHaveBeenCalledTimes(CONTROL_FILES.length);
    expect(calls.map(({ destination }) => path.basename(destination))).toEqual(
      CONTROL_FILES,
    );
    expect(calls.every(({ options }) => options.flag === "wx")).toBe(true);
    expect(calls.every(({ options }) => options.encoding === "utf8")).toBe(
      true,
    );
  });

  it("keeps document-register byte-for-byte legacy compatible without documents", async () => {
    await run();

    expect(
      await readFile(
        path.join(matterPath, "00 CONTROL", "document-register.md"),
        "utf8",
      ),
    ).toBe(LEGACY_DOCUMENT_REGISTER);
    expect(
      await pathExists(
        path.join(matterPath, "01 ULAZ", "00 INITIAL INTAKE"),
      ),
    ).toBe(false);
  });

  it("stores one initial document byte-for-byte in the intake folder", async () => {
    const document = documentFor("PDF bytes", "document.pdf");

    const result = await run([document]);

    expect(result).toEqual({ ok: true, initialDocumentsSaved: 1 });
    expect(
      await readFile(
        path.join(
          matterPath,
          "01 ULAZ",
          "00 INITIAL INTAKE",
          "document.pdf",
        ),
      ),
    ).toEqual(Buffer.from("PDF bytes"));
  });

  it("stores multiple documents byte-for-byte and preserves register order", async () => {
    const documents = [
      documentFor("first", "prvi.pdf"),
      documentFor("second", "drugi.docx"),
      documentFor("third", "treci.txt"),
    ];

    const result = await run(documents);
    const register = await readFile(
      path.join(matterPath, "00 CONTROL", "document-register.md"),
      "utf8",
    );

    expect(result).toEqual({ ok: true, initialDocumentsSaved: 3 });
    expect(
      await readFile(
        path.join(
          matterPath,
          "01 ULAZ",
          "00 INITIAL INTAKE",
          "prvi.pdf",
        ),
      ),
    ).toEqual(Buffer.from("first"));
    expect(register.indexOf("| 1 | prvi.pdf |")).toBeLessThan(
      register.indexOf("| 2 | drugi.docx |"),
    );
    expect(register.indexOf("| 2 | drugi.docx |")).toBeLessThan(
      register.indexOf("| 3 | treci.txt |"),
    );
  });

  it("uses openingDate and preserves the exact register separator", async () => {
    await run([documentFor("pdf", "a.pdf")]);
    const register = await readFile(
      path.join(matterPath, "00 CONTROL", "document-register.md"),
      "utf8",
    );

    expect(register).toContain("|---|---|---|---|---|---|");
    expect(register).toContain("| 1 | a.pdf | 2026-07-29 | PDF |");
    expect(register.endsWith("\n")).toBe(true);
  });

  it("writes document-register once with generated rows in that write", async () => {
    const registerWrites: string[] = [];
    const writeSpy = vi.fn(
      async (
        destination: string,
        content: string,
        options: Readonly<{ encoding: "utf8"; flag: "wx" }>,
      ) => {
        if (path.basename(destination) === "document-register.md") {
          registerWrites.push(content);
        }
        await writeFile(destination, content, options);
      },
    );

    await run([documentFor("pdf", "a.pdf")], { writeFile: writeSpy });

    expect(registerWrites).toHaveLength(1);
    expect(registerWrites[0]).toContain("| 1 | a.pdf | 2026-07-29 |");
  });

  it("passes the same initialDocuments array to storage and register without mutation", async () => {
    const documents = [documentFor("pdf", "a.pdf")];
    const snapshot = JSON.stringify(
      documents.map(({ normalizedName, extension, size }) => ({
        normalizedName,
        extension,
        size,
      })),
    );
    const storageSpy = vi.fn(nodeDependencies.storeInitialDocuments);
    const registerSpy = vi.fn(nodeDependencies.buildInitialDocumentRegisterRows);

    await run(documents, {
      storeInitialDocuments: storageSpy,
      buildInitialDocumentRegisterRows: registerSpy,
    });

    expect(storageSpy.mock.calls[0]?.[0].documents).toBe(documents);
    expect(registerSpy.mock.calls[0]?.[1]).toBe(documents);
    expect(
      JSON.stringify(
        documents.map(({ normalizedName, extension, size }) => ({
          normalizedName,
          extension,
          size,
        })),
      ),
    ).toBe(snapshot);
  });

  it("returns a collision before staging when final matter already exists", async () => {
    await mkdir(matterPath);
    const mkdirSpy = vi.fn(nodeDependencies.mkdir);

    const result = await run([], { mkdir: mkdirSpy });

    expect(result).toEqual({
      ok: false,
      error: "MATTER_ALREADY_EXISTS",
      collision: true,
      cleanupFailed: false,
    });
    expect(mkdirSpy).not.toHaveBeenCalled();
    expect(await pathExists(stagingPath)).toBe(false);
  });

  it("rejects a matterPath outside the validated client before mutation", async () => {
    const mkdirSpy = vi.fn(nodeDependencies.mkdir);
    const outsideMatterPath = path.join(tempRoot, matterFolder);

    const result = await createMatterTransactionWithDependencies(
      { ...transactionInput(), matterPath: outsideMatterPath },
      dependenciesWith({ mkdir: mkdirSpy }),
    );

    expect(result).toMatchObject({
      ok: false,
      error: "INVALID_TRANSACTION_STRUCTURE",
    });
    expect(mkdirSpy).not.toHaveBeenCalled();
  });

  it("rejects a matterFolder that does not match matterPath basename", async () => {
    const mkdirSpy = vi.fn(nodeDependencies.mkdir);

    const result = await createMatterTransactionWithDependencies(
      { ...transactionInput(), matterFolder: "SDJ_DIFFERENT" },
      dependenciesWith({ mkdir: mkdirSpy }),
    );

    expect(result).toMatchObject({
      ok: false,
      error: "INVALID_TRANSACTION_STRUCTURE",
    });
    expect(mkdirSpy).not.toHaveBeenCalled();
  });

  it("rejects an invalid staging UUID before mkdir or cleanup", async () => {
    const mkdirSpy = vi.fn(nodeDependencies.mkdir);
    const rmSpy = vi.fn(nodeDependencies.rm);

    const result = await run([], {
      randomUUID: () => "not-a-uuid",
      mkdir: mkdirSpy,
      rm: rmSpy,
    });

    expect(result).toMatchObject({
      ok: false,
      error: "INVALID_TRANSACTION_STRUCTURE",
      cleanupFailed: false,
    });
    expect(mkdirSpy).not.toHaveBeenCalled();
    expect(rmSpy).not.toHaveBeenCalled();
  });

  it("does not cleanup a staging path that mkdir did not successfully create", async () => {
    await mkdir(stagingPath);
    const markerPath = path.join(stagingPath, "foreign-marker.txt");
    await writeFile(markerPath, "foreign");
    const rmSpy = vi.fn(nodeDependencies.rm);

    const result = await run([], { rm: rmSpy });

    expect(result).toMatchObject({
      ok: false,
      error: "INVALID_TRANSACTION_STRUCTURE",
      cleanupFailed: false,
    });
    expect(rmSpy).not.toHaveBeenCalled();
    expect(await readFile(markerPath, "utf8")).toBe("foreign");
  });

  it("cleans its own staging after a matter subfolder mkdir failure", async () => {
    let mkdirCalls = 0;
    const result = await run([], {
      mkdir: async (candidate) => {
        mkdirCalls += 1;
        if (mkdirCalls === 4) {
          throw new Error("private subfolder mkdir failure");
        }
        await mkdir(candidate);
      },
    });

    expect(result).toMatchObject({
      ok: false,
      error: "INVALID_TRANSACTION_STRUCTURE",
      cleanupFailed: false,
    });
    expect(await pathExists(stagingPath)).toBe(false);
    expect(await pathExists(matterPath)).toBe(false);
    expect(JSON.stringify(result)).not.toContain("private");
  });

  it.each([
    ["controlled failure", { ok: false, error: "DOCUMENT_WRITE_FAILED", cleanupFailed: false }],
    ["storage cleanup failure", { ok: false, error: "DOCUMENT_READ_FAILED", cleanupFailed: true }],
  ] as const)(
    "cleans the whole staging matter after storage %s",
    async (_scenario, storageResult) => {
      const rmSpy = vi.fn(nodeDependencies.rm);

      const result = await run([documentFor("pdf", "a.pdf")], {
        storeInitialDocuments: async () => storageResult,
        rm: rmSpy,
      });

      expect(result).toMatchObject({
        ok: false,
        error: "STORAGE_FAILED",
        cleanupFailed: false,
      });
      expect(rmSpy).toHaveBeenCalledWith(stagingPath, {
        recursive: true,
        force: true,
      });
      expect(await pathExists(stagingPath)).toBe(false);
      expect(await pathExists(matterPath)).toBe(false);
    },
  );

  it("maps a thrown storage exception without exposing it", async () => {
    const privateMessage = `storage failed at ${tempRoot}\\private.pdf`;

    const result = await run([documentFor("pdf", "private.pdf")], {
      storeInitialDocuments: async () => {
        throw new Error(privateMessage);
      },
    });

    expect(result).toMatchObject({ ok: false, error: "STORAGE_FAILED" });
    expect(JSON.stringify(result)).not.toContain(privateMessage);
    expect(JSON.stringify(result)).not.toContain("private.pdf");
  });

  it.each([
    [
      "controlled",
      () =>
        ({
          ok: false,
          error: "INVALID_DOCUMENT_METADATA",
        }) as const,
    ],
    ["thrown", () => {
      throw new Error("private register row");
    }],
  ] as const)("cleans staging after a %s register failure", async (_case, buildRows) => {
    const result = await run([documentFor("pdf", "a.pdf")], {
      buildInitialDocumentRegisterRows: buildRows,
    });

    expect(result).toMatchObject({ ok: false, error: "REGISTER_FAILED" });
    expect(JSON.stringify(result)).not.toContain("private register row");
    expect(await pathExists(stagingPath)).toBe(false);
    expect(await pathExists(matterPath)).toBe(false);
  });

  it("stops CONTROL writes after the selected failure and skips rename", async () => {
    const writes: string[] = [];
    const renameSpy = vi.fn(nodeDependencies.rename);
    const writeSpy = vi.fn(
      async (
        destination: string,
        content: string,
        options: Readonly<{ encoding: "utf8"; flag: "wx" }>,
      ) => {
        writes.push(path.basename(destination));
        if (writes.length === 4) {
          throw new Error("private fourth write failure");
        }
        await writeFile(destination, content, options);
      },
    );

    const result = await run([], {
      writeFile: writeSpy,
      rename: renameSpy,
    });

    expect(result).toMatchObject({
      ok: false,
      error: "CONTROL_WRITE_FAILED",
    });
    expect(writes).toEqual(CONTROL_FILES.slice(0, 4));
    expect(renameSpy).not.toHaveBeenCalled();
    expect(await pathExists(stagingPath)).toBe(false);
  });

  it("cleans a partial CONTROL write before returning the primary error", async () => {
    const result = await run([], {
      writeFile: async (destination, content) => {
        await writeFile(destination, content, { flag: "w" });
        throw new Error("partial control write");
      },
    });

    expect(result).toMatchObject({
      ok: false,
      error: "CONTROL_WRITE_FAILED",
    });
    expect(await pathExists(stagingPath)).toBe(false);
    expect(await pathExists(matterPath)).toBe(false);
  });

  it("preserves the primary CONTROL error when route-level cleanup fails", async () => {
    const result = await run([], {
      writeFile: async () => {
        throw new Error("private write error");
      },
      rm: async () => {
        throw new Error("private cleanup error");
      },
    });

    expect(result).toEqual({
      ok: false,
      error: "CONTROL_WRITE_FAILED",
      collision: false,
      cleanupFailed: true,
    });
    expect(JSON.stringify(result)).not.toContain("private");
  });

  it("uses exactly stagingPath as cleanup target, never client or matterPath", async () => {
    const rmTargets: string[] = [];

    await run([], {
      writeFile: async () => {
        throw new Error("write failure");
      },
      rm: async (candidate, options) => {
        rmTargets.push(candidate);
        await rm(candidate, options);
      },
    });

    expect(rmTargets).toEqual([stagingPath]);
    expect(rmTargets).not.toContain(realClientPath);
    expect(rmTargets).not.toContain(matterPath);
  });

  it.each(["EEXIST", "ENOTEMPTY"])(
    "maps rename %s to a controlled collision and cleans staging",
    async (code) => {
      const result = await run([], {
        rename: async () => {
          throw errorWithCode(code);
        },
      });

      expect(result).toEqual({
        ok: false,
        error: "MATTER_ALREADY_EXISTS",
        collision: true,
        cleanupFailed: false,
      });
      expect(await pathExists(stagingPath)).toBe(false);
      expect(JSON.stringify(result)).not.toContain(code);
    },
  );

  it("maps a generic rename failure and cleans staging", async () => {
    const result = await run([], {
      rename: async () => {
        throw errorWithCode("EACCES");
      },
    });

    expect(result).toEqual({
      ok: false,
      error: "RENAME_FAILED",
      collision: false,
      cleanupFailed: false,
    });
    expect(await pathExists(stagingPath)).toBe(false);
    expect(await pathExists(matterPath)).toBe(false);
    expect(JSON.stringify(result)).not.toContain("EACCES");
  });

  it("does not cleanup after a successful final rename", async () => {
    const rmSpy = vi.fn(nodeDependencies.rm);

    const result = await run([], { rm: rmSpy });

    expect(result.ok).toBe(true);
    expect(rmSpy).not.toHaveBeenCalled();
    expect(await pathExists(matterPath)).toBe(true);
  });

  it("preserves a final matter created in the pre-rename race", async () => {
    let matterChecks = 0;
    const exists = async (candidate: string) => {
      if (candidate === matterPath) {
        matterChecks += 1;
        if (matterChecks === 2) {
          await mkdir(matterPath);
          return true;
        }
        return false;
      }
      return nodeDependencies.exists(candidate);
    };

    const result = await run([], { exists });

    expect(result).toMatchObject({
      ok: false,
      error: "MATTER_ALREADY_EXISTS",
      collision: true,
    });
    expect(await pathExists(matterPath)).toBe(true);
    expect(await pathExists(stagingPath)).toBe(false);
  });

  it("never removes a sibling staging or final folder", async () => {
    const siblingStaging = path.join(
      realClientPath,
      ".sdj-mike-staging-660e8400-e29b-41d4-a716-446655440000",
    );
    const siblingFinal = path.join(realClientPath, "SDJ_SIBLING");
    await mkdir(siblingStaging);
    await mkdir(siblingFinal);

    await run([], {
      writeFile: async () => {
        throw new Error("write failure");
      },
    });

    expect(await pathExists(siblingStaging)).toBe(true);
    expect(await pathExists(siblingFinal)).toBe(true);
  });

  it("allows a clean retry after transaction rollback", async () => {
    const first = await run([], {
      writeFile: async () => {
        throw new Error("first attempt");
      },
    });
    const second = await run();

    expect(first).toMatchObject({ ok: false });
    expect(second).toEqual({ ok: true, initialDocumentsSaved: 0 });
    expect(await pathExists(matterPath)).toBe(true);
  });

  it("returns a controlled structure failure when existence checking throws", async () => {
    const result = await run([], {
      exists: async () => {
        throw new Error(`private stat ${tempRoot}`);
      },
    });

    expect(result).toEqual({
      ok: false,
      error: "MATTER_CHECK_FAILED",
      collision: false,
      cleanupFailed: false,
    });
    expect(JSON.stringify(result)).not.toContain(tempRoot);
  });

  it("publishes no staging UUID and leaves only the final matter after success", async () => {
    await run([documentFor("pdf", "document.pdf")]);

    const children = await readdir(realClientPath);
    expect(children).toEqual([matterFolder]);
    expect(children.join(" ")).not.toContain(".sdj-mike-staging-");
  });
});

describe("POST /api/matters controlled pre-workspace contracts", () => {
  it("keeps malformed JSON mapped to parser status 400", async () => {
    const result = await parseMatterRequest(
      new Request("http://localhost/api/matters", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{",
      }),
    );

    expect(result).toEqual({
      ok: false,
      error: "Neispravan JSON zahtev.",
      status: 400,
    });
  });

  it("keeps unsupported Content-Type mapped to parser status 415", async () => {
    const result = await parseMatterRequest(
      new Request("http://localhost/api/matters", {
        method: "POST",
        headers: { "Content-Type": "text/plain" },
        body: "private request content",
      }),
    );

    expect(result).toEqual({
      ok: false,
      error: "Nepodržan tip zahtjeva.",
      status: 415,
    });
    expect(JSON.stringify(result)).not.toContain("private request content");
  });

  it("keeps invalid initial document metadata mapped to parser status 400", async () => {
    const formData = new FormData();
    for (const [field, value] of Object.entries(validControlInput)) {
      formData.append(field, value);
    }
    formData.append(
      "initialDocuments",
      new File(["private"], "private.exe"),
      "private.exe",
    );

    const result = await parseMatterRequest(
      new Request("http://localhost/api/matters", {
        method: "POST",
        body: formData,
      }),
    );

    expect(result).toEqual({
      ok: false,
      error:
        "Početna dokumentacija nije prihvaćena. Provjerite tip, naziv, broj i veličinu fajlova.",
      status: 400,
    });
    expect(JSON.stringify(result)).not.toContain("private.exe");
  });

  it("removes the 501 guard and adds only the compatible success count field", async () => {
    const routeSource = await readFile(
      path.join(process.cwd(), "src", "app", "api", "matters", "route.ts"),
      "utf8",
    );

    expect(routeSource).not.toContain("status: 501");
    expect(routeSource).not.toContain(
      "INITIAL_DOCUMENT_STORAGE_PENDING_MESSAGE",
    );
    expect(routeSource).toContain(
      "initialDocumentsSaved: transaction.initialDocumentsSaved",
    );
    expect(routeSource).toContain("clientFolder,");
    expect(routeSource).toContain("matterFolder: folderName");
    expect(routeSource).toContain("createdFolders: [...MATTER_FOLDERS]");
    expect(routeSource).toContain("createdFiles: [...CONTROL_FILES]");
  });
});
