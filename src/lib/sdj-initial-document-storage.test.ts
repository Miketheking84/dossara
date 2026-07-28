import {
  lstat,
  mkdir,
  mkdtemp,
  readFile,
  realpath,
  rm,
  symlink,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  INITIAL_DOCUMENT_STORAGE_RELATIVE_FOLDER,
  storeInitialDocumentsInStaging,
  storeInitialDocumentsInStagingWithDependencies,
  type InitialDocumentStorageDependencies,
  type StagedInitialDocument,
} from "./sdj-initial-document-storage";

const nodeDependencies: InitialDocumentStorageDependencies = {
  lstat,
  realpath,
  mkdir: async (candidate) => {
    await mkdir(candidate);
  },
  writeFile: async (destination, data, options) => {
    await writeFile(destination, data, options);
  },
  bufferFrom: (arrayBuffer) => Buffer.from(arrayBuffer),
  rm: async (candidate, options) => {
    await rm(candidate, options);
  },
};

function dependenciesWith(
  overrides: Partial<InitialDocumentStorageDependencies>,
): InitialDocumentStorageDependencies {
  return { ...nodeDependencies, ...overrides };
}

function documentFor(
  content: string,
  normalizedName: string,
  browserName = normalizedName,
): StagedInitialDocument {
  const file = new File([content], browserName);
  return { file, normalizedName, size: file.size };
}

function documentWithArrayBuffer(
  normalizedName: string,
  size: number,
  arrayBuffer: () => Promise<ArrayBuffer>,
): StagedInitialDocument {
  return {
    file: { arrayBuffer } as File,
    normalizedName,
    size,
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

describe("storeInitialDocumentsInStaging", () => {
  const validStagingFolderName =
    ".sdj-mike-staging-550e8400-e29b-41d4-a716-446655440000";
  let tempRoot: string;
  let stagingMatterPath: string;
  let ulazPath: string;
  let intakePath: string;

  beforeEach(async () => {
    tempRoot = await mkdtemp(path.join(tmpdir(), "sdj-initial-storage-"));
    stagingMatterPath = path.join(tempRoot, validStagingFolderName);
    ulazPath = path.join(stagingMatterPath, "01 ULAZ");
    intakePath = path.join(ulazPath, "00 INITIAL INTAKE");
    await mkdir(ulazPath, { recursive: true });
  });

  afterEach(async () => {
    await rm(tempRoot, { recursive: true, force: true });
  });

  it("returns an empty success without creating the intake folder", async () => {
    const result = await storeInitialDocumentsInStaging({
      stagingMatterPath,
      documents: [],
    });

    expect(result).toEqual({
      ok: true,
      savedCount: 0,
      relativeFolder: null,
    });
    expect(await pathExists(intakePath)).toBe(false);
  });

  it("accepts the exact UUID staging basename contract", async () => {
    const result = await storeInitialDocumentsInStaging({
      stagingMatterPath,
      documents: [documentFor("pdf", "a.pdf")],
    });

    expect(result).toMatchObject({ ok: true, savedCount: 1 });
  });

  it.each(["SDJ_2026-07-27_CLIENT_MATTER", ".sdj-mike-staging-test"])(
    "rejects the non-staging basename %s",
    async (folderName) => {
      const candidate = path.join(tempRoot, folderName);
      await mkdir(path.join(candidate, "01 ULAZ"), { recursive: true });

      const result = await storeInitialDocumentsInStaging({
        stagingMatterPath: candidate,
        documents: [documentFor("pdf", "a.pdf")],
      });

      expect(result).toEqual({
        ok: false,
        error: "INVALID_STAGING_STRUCTURE",
        cleanupFailed: false,
      });
      expect(
        await pathExists(path.join(candidate, "01 ULAZ", "00 INITIAL INTAKE")),
      ).toBe(false);
    },
  );

  it("accepts an uppercase staging prefix and UUID", async () => {
    const candidate = path.join(tempRoot, validStagingFolderName.toUpperCase());
    await mkdir(path.join(candidate, "01 ULAZ"), { recursive: true });

    const result = await storeInitialDocumentsInStaging({
      stagingMatterPath: candidate,
      documents: [documentFor("pdf", "a.pdf")],
    });

    expect(result).toMatchObject({ ok: true, savedCount: 1 });
  });

  it("rejects a relative staging path before filesystem access", async () => {
    const lstatSpy = vi.fn(nodeDependencies.lstat);
    const result = await storeInitialDocumentsInStagingWithDependencies(
      {
        stagingMatterPath: validStagingFolderName,
        documents: [documentFor("pdf", "a.pdf")],
      },
      dependenciesWith({ lstat: lstatSpy }),
    );

    expect(result).toEqual({
      ok: false,
      error: "INVALID_STAGING_STRUCTURE",
      cleanupFailed: false,
    });
    expect(lstatSpy).not.toHaveBeenCalled();
  });

  it("accepts a trailing separator on a valid staging path", async () => {
    const result = await storeInitialDocumentsInStaging({
      stagingMatterPath: `${stagingMatterPath}${path.sep}`,
      documents: [documentFor("pdf", "a.pdf")],
    });

    expect(result).toMatchObject({ ok: true, savedCount: 1 });
  });

  it("handles Windows drive-letter casing case-insensitively", async ({
    skip,
  }) => {
    if (process.platform !== "win32" || !/^[A-Za-z]:/.test(stagingMatterPath)) {
      skip("Drive-letter casing is Windows-specific.");
    }
    const alternateDriveCase =
      stagingMatterPath[0] === stagingMatterPath[0].toUpperCase()
        ? stagingMatterPath[0].toLowerCase() + stagingMatterPath.slice(1)
        : stagingMatterPath[0].toUpperCase() + stagingMatterPath.slice(1);

    const result = await storeInitialDocumentsInStaging({
      stagingMatterPath: alternateDriveCase,
      documents: [documentFor("pdf", "a.pdf")],
    });

    expect(result).toMatchObject({ ok: true, savedCount: 1 });
  });

  it("stores one file with its exact name and bytes", async () => {
    const result = await storeInitialDocumentsInStaging({
      stagingMatterPath,
      documents: [documentFor("PDF bytes", "document.pdf")],
    });

    expect(result).toEqual({
      ok: true,
      savedCount: 1,
      relativeFolder: INITIAL_DOCUMENT_STORAGE_RELATIVE_FOLDER,
    });
    expect(await readFile(path.join(intakePath, "document.pdf"))).toEqual(
      Buffer.from("PDF bytes"),
    );
  });

  it("reads and writes multiple files strictly sequentially", async () => {
    const calls: string[] = [];
    let activeReads = 0;
    let maximumActiveReads = 0;
    const trackedDocument = (
      label: string,
      normalizedName: string,
    ): StagedInitialDocument =>
      documentWithArrayBuffer(normalizedName, 1, async () => {
        calls.push(`read:${label}`);
        activeReads += 1;
        maximumActiveReads = Math.max(maximumActiveReads, activeReads);
        await Promise.resolve();
        activeReads -= 1;
        return Uint8Array.of(label.charCodeAt(0)).buffer;
      });
    const writeFileSpy = vi.fn(
      async (
        destination: string,
        data: Uint8Array,
        options: Readonly<{ flag: "wx" }>,
      ) => {
        calls.push(`write:${path.basename(destination)}`);
        await writeFile(destination, data, options);
      },
    );

    const result = await storeInitialDocumentsInStagingWithDependencies(
      {
        stagingMatterPath,
        documents: [
          trackedDocument("a", "a.pdf"),
          trackedDocument("b", "b.pdf"),
          trackedDocument("c", "c.pdf"),
        ],
      },
      dependenciesWith({ writeFile: writeFileSpy }),
    );

    expect(result).toMatchObject({ ok: true, savedCount: 3 });
    expect(calls).toEqual([
      "read:a",
      "write:a.pdf",
      "read:b",
      "write:b.pdf",
      "read:c",
      "write:c.pdf",
    ]);
    expect(maximumActiveReads).toBe(1);
    expect(writeFileSpy).toHaveBeenCalledTimes(3);
  });

  it("uses the NFC normalizedName as the destination", async () => {
    const normalizedName = "café.pdf";
    await storeInitialDocumentsInStaging({
      stagingMatterPath,
      documents: [documentFor("pdf", normalizedName, "cafe\u0301.pdf")],
    });

    expect(await pathExists(path.join(intakePath, normalizedName))).toBe(true);
    expect(await pathExists(path.join(intakePath, "cafe\u0301.pdf"))).toBe(
      false,
    );
  });

  it("uses normalizedName instead of file.name", async () => {
    await storeInitialDocumentsInStaging({
      stagingMatterPath,
      documents: [
        documentFor("pdf", "normalized.pdf", "browser-original.pdf"),
      ],
    });

    expect(await pathExists(path.join(intakePath, "normalized.pdf"))).toBe(
      true,
    );
    expect(
      await pathExists(path.join(intakePath, "browser-original.pdf")),
    ).toBe(false);
  });

  it("does not expose absolute paths or filenames in the success result", async () => {
    const result = await storeInitialDocumentsInStaging({
      stagingMatterPath,
      documents: [documentFor("private", "private-client.pdf")],
    });
    const serialized = JSON.stringify(result);

    expect(serialized).not.toContain(stagingMatterPath);
    expect(serialized).not.toContain("private-client.pdf");
  });

  it("rejects a missing staging matter", async () => {
    await rm(stagingMatterPath, { recursive: true, force: true });
    const rmSpy = vi.fn(nodeDependencies.rm);

    await expect(
      storeInitialDocumentsInStagingWithDependencies(
        {
          stagingMatterPath,
          documents: [documentFor("pdf", "a.pdf")],
        },
        dependenciesWith({ rm: rmSpy }),
      ),
    ).resolves.toEqual({
      ok: false,
      error: "INVALID_STAGING_STRUCTURE",
      cleanupFailed: false,
    });
    expect(rmSpy).not.toHaveBeenCalled();
  });

  it("rejects a staging matter that is a file", async () => {
    await rm(stagingMatterPath, { recursive: true, force: true });
    await writeFile(stagingMatterPath, "not a directory");

    const result = await storeInitialDocumentsInStaging({
      stagingMatterPath,
      documents: [documentFor("pdf", "a.pdf")],
    });

    expect(result).toMatchObject({
      ok: false,
      error: "INVALID_STAGING_STRUCTURE",
    });
  });

  it("rejects a staging symlink or junction", async ({ skip }) => {
    const target = path.join(tempRoot, "staging-target");
    await rm(stagingMatterPath, { recursive: true, force: true });
    await mkdir(path.join(target, "01 ULAZ"), { recursive: true });
    try {
      await symlink(
        target,
        stagingMatterPath,
        process.platform === "win32" ? "junction" : "dir",
      );
    } catch (error) {
      if (
        ["EPERM", "EACCES", "ENOSYS"].includes(
          (error as NodeJS.ErrnoException).code ?? "",
        )
      ) {
        skip("Filesystem account cannot create directory links.");
      }
      throw error;
    }

    const result = await storeInitialDocumentsInStaging({
      stagingMatterPath,
      documents: [documentFor("pdf", "a.pdf")],
    });

    expect(result).toMatchObject({
      ok: false,
      error: "INVALID_STAGING_STRUCTURE",
    });
  });

  it("rejects a missing 01 ULAZ folder", async () => {
    await rm(ulazPath, { recursive: true, force: true });

    const result = await storeInitialDocumentsInStaging({
      stagingMatterPath,
      documents: [documentFor("pdf", "a.pdf")],
    });

    expect(result).toMatchObject({
      ok: false,
      error: "INVALID_STAGING_STRUCTURE",
    });
  });

  it("rejects 01 ULAZ when it is a file", async () => {
    await rm(ulazPath, { recursive: true, force: true });
    await writeFile(ulazPath, "not a directory");

    const result = await storeInitialDocumentsInStaging({
      stagingMatterPath,
      documents: [documentFor("pdf", "a.pdf")],
    });

    expect(result).toMatchObject({
      ok: false,
      error: "INVALID_STAGING_STRUCTURE",
    });
  });

  it("rejects a 01 ULAZ symlink or junction", async ({ skip }) => {
    const target = path.join(tempRoot, "ulaz-target");
    await rm(ulazPath, { recursive: true, force: true });
    await mkdir(target);
    try {
      await symlink(
        target,
        ulazPath,
        process.platform === "win32" ? "junction" : "dir",
      );
    } catch (error) {
      if (
        ["EPERM", "EACCES", "ENOSYS"].includes(
          (error as NodeJS.ErrnoException).code ?? "",
        )
      ) {
        skip("Filesystem account cannot create directory links.");
      }
      throw error;
    }

    const result = await storeInitialDocumentsInStaging({
      stagingMatterPath,
      documents: [documentFor("pdf", "a.pdf")],
    });

    expect(result).toMatchObject({
      ok: false,
      error: "INVALID_STAGING_STRUCTURE",
    });
  });

  it("rejects an existing intake folder without writing into it", async () => {
    await mkdir(intakePath);
    await writeFile(path.join(intakePath, "existing.pdf"), "existing");
    const rmSpy = vi.fn(nodeDependencies.rm);

    const result = await storeInitialDocumentsInStagingWithDependencies(
      {
        stagingMatterPath,
        documents: [documentFor("new", "new.pdf")],
      },
      dependenciesWith({ rm: rmSpy }),
    );

    expect(result).toEqual({
      ok: false,
      error: "INTAKE_ALREADY_EXISTS",
      cleanupFailed: false,
    });
    expect(await readFile(path.join(intakePath, "existing.pdf"), "utf8")).toBe(
      "existing",
    );
    expect(await pathExists(path.join(intakePath, "new.pdf"))).toBe(false);
    expect(rmSpy).not.toHaveBeenCalled();
  });

  it("rejects an existing intake file without cleanup", async () => {
    await writeFile(intakePath, "existing");
    const rmSpy = vi.fn(nodeDependencies.rm);

    const result = await storeInitialDocumentsInStagingWithDependencies(
      {
        stagingMatterPath,
        documents: [documentFor("new", "new.pdf")],
      },
      dependenciesWith({ rm: rmSpy }),
    );

    expect(result).toEqual({
      ok: false,
      error: "INTAKE_ALREADY_EXISTS",
      cleanupFailed: false,
    });
    expect(await readFile(intakePath, "utf8")).toBe("existing");
    expect(rmSpy).not.toHaveBeenCalled();
  });

  it("rejects an existing intake symlink or junction without cleanup", async ({
    skip,
  }) => {
    const target = path.join(tempRoot, "existing-intake-target");
    await mkdir(target);
    try {
      await symlink(
        target,
        intakePath,
        process.platform === "win32" ? "junction" : "dir",
      );
    } catch (error) {
      if (
        ["EPERM", "EACCES", "ENOSYS"].includes(
          (error as NodeJS.ErrnoException).code ?? "",
        )
      ) {
        skip("Filesystem account cannot create directory links.");
      }
      throw error;
    }
    const rmSpy = vi.fn(nodeDependencies.rm);

    const result = await storeInitialDocumentsInStagingWithDependencies(
      {
        stagingMatterPath,
        documents: [documentFor("new", "new.pdf")],
      },
      dependenciesWith({ rm: rmSpy }),
    );

    expect(result).toEqual({
      ok: false,
      error: "INTAKE_ALREADY_EXISTS",
      cleanupFailed: false,
    });
    expect(await pathExists(target)).toBe(true);
    expect(rmSpy).not.toHaveBeenCalled();
  });

  it.each([
    ["dot-dot", ".."],
    ["dot", "."],
    ["slash", "../escape.pdf"],
    ["backslash", "..\\escape.pdf"],
    ["colon", "C:escape.pdf"],
    ["absolute path", path.resolve(tmpdir(), "escape.pdf")],
    ["control character", "a\u0007b.pdf"],
    ["trailing dot", "document.pdf."],
    ["trailing space", "document.pdf "],
    ["UNC-like path", "\\\\server\\share\\document.pdf"],
    ["alternate data stream", "document.pdf:stream"],
    ["reserved CON base name", "CON.pdf"],
    ["reserved NUL base name", "NUL.txt"],
    ["reserved COM1 base name", "COM1.pdf"],
    ["reserved LPT9 base name", "LPT9.txt"],
  ])("rejects a normalizedName containing %s", async (_case, name) => {
    const result = await storeInitialDocumentsInStaging({
      stagingMatterPath,
      documents: [documentFor("pdf", name)],
    });

    expect(result).toEqual({
      ok: false,
      error: "INVALID_DOCUMENT_CONTRACT",
      cleanupFailed: false,
    });
    expect(await pathExists(intakePath)).toBe(false);
  });

  it("rejects a destination containment attempt before any write", async () => {
    const writeFileSpy = vi.fn(nodeDependencies.writeFile);
    const result = await storeInitialDocumentsInStagingWithDependencies(
      {
        stagingMatterPath,
        documents: [documentFor("pdf", `..${path.sep}outside.pdf`)],
      },
      dependenciesWith({ writeFile: writeFileSpy }),
    );

    expect(result).toMatchObject({
      ok: false,
      error: "INVALID_DOCUMENT_CONTRACT",
    });
    expect(writeFileSpy).not.toHaveBeenCalled();
  });

  it.each([1.5, Number.MAX_SAFE_INTEGER + 1])(
    "rejects the unsafe size contract %s before mutation",
    async (size) => {
      const file = new File(["pdf"], "a.pdf");
      const result = await storeInitialDocumentsInStaging({
        stagingMatterPath,
        documents: [{ file, normalizedName: "a.pdf", size }],
      });

      expect(result).toEqual({
        ok: false,
        error: "INVALID_DOCUMENT_CONTRACT",
        cleanupFailed: false,
      });
      expect(await pathExists(intakePath)).toBe(false);
    },
  );

  it("rejects a staging realpath mismatch", async () => {
    const outside = path.join(tempRoot, "outside-staging");
    await mkdir(outside);
    const result = await storeInitialDocumentsInStagingWithDependencies(
      {
        stagingMatterPath,
        documents: [documentFor("pdf", "a.pdf")],
      },
      dependenciesWith({
        realpath: async (candidate) =>
          candidate === stagingMatterPath
            ? outside
            : nodeDependencies.realpath(candidate),
      }),
    );

    expect(result).toMatchObject({
      ok: false,
      error: "INVALID_STAGING_STRUCTURE",
    });
    expect(await pathExists(intakePath)).toBe(false);
  });

  it("rejects a 01 ULAZ realpath outside staging", async () => {
    const outside = path.join(tempRoot, "outside-ulaz");
    await mkdir(outside);
    const result = await storeInitialDocumentsInStagingWithDependencies(
      {
        stagingMatterPath,
        documents: [documentFor("pdf", "a.pdf")],
      },
      dependenciesWith({
        realpath: async (candidate) =>
          candidate === ulazPath
            ? outside
            : nodeDependencies.realpath(candidate),
      }),
    );

    expect(result).toMatchObject({
      ok: false,
      error: "INVALID_STAGING_STRUCTURE",
    });
    expect(await pathExists(intakePath)).toBe(false);
  });

  it("cleans exactly intake after a post-create lstat mismatch", async () => {
    const rmSpy = vi.fn(nodeDependencies.rm);
    const result = await storeInitialDocumentsInStagingWithDependencies(
      {
        stagingMatterPath,
        documents: [documentFor("pdf", "a.pdf")],
      },
      dependenciesWith({
        lstat: async (candidate) =>
          candidate === intakePath
            ? {
                isDirectory: () => false,
                isSymbolicLink: () => false,
              }
            : nodeDependencies.lstat(candidate),
        rm: rmSpy,
      }),
    );

    expect(result).toEqual({
      ok: false,
      error: "INVALID_STAGING_STRUCTURE",
      cleanupFailed: false,
    });
    expect(rmSpy).toHaveBeenCalledTimes(1);
    expect(rmSpy).toHaveBeenCalledWith(intakePath, {
      recursive: true,
      force: true,
    });
    expect(await pathExists(stagingMatterPath)).toBe(true);
    expect(await pathExists(ulazPath)).toBe(true);
  });

  it("cleans exactly intake after a post-create realpath mismatch", async () => {
    const outside = path.join(tempRoot, "outside-intake");
    await mkdir(outside);
    const rmSpy = vi.fn(nodeDependencies.rm);
    const result = await storeInitialDocumentsInStagingWithDependencies(
      {
        stagingMatterPath,
        documents: [documentFor("pdf", "a.pdf")],
      },
      dependenciesWith({
        realpath: async (candidate) =>
          candidate === intakePath
            ? outside
            : nodeDependencies.realpath(candidate),
        rm: rmSpy,
      }),
    );

    expect(result).toEqual({
      ok: false,
      error: "INVALID_STAGING_STRUCTURE",
      cleanupFailed: false,
    });
    expect(rmSpy).toHaveBeenCalledTimes(1);
    expect(rmSpy).toHaveBeenCalledWith(intakePath, {
      recursive: true,
      force: true,
    });
    expect(await pathExists(stagingMatterPath)).toBe(true);
    expect(await pathExists(ulazPath)).toBe(true);
  });

  it("uses the wx write flag", async () => {
    const writeFileSpy = vi.fn(nodeDependencies.writeFile);

    await storeInitialDocumentsInStagingWithDependencies(
      {
        stagingMatterPath,
        documents: [documentFor("pdf", "a.pdf")],
      },
      dependenciesWith({ writeFile: writeFileSpy }),
    );

    expect(writeFileSpy).toHaveBeenCalledWith(
      path.join(intakePath, "a.pdf"),
      expect.any(Uint8Array),
      { flag: "wx" },
    );
  });

  it("rejects a destination collision without overwriting", async () => {
    let contentBeforeWrite: Buffer | undefined;
    const dependencies = dependenciesWith({
      mkdir: async (candidate) => {
        await mkdir(candidate);
        await writeFile(path.join(candidate, "a.pdf"), "existing");
      },
      writeFile: async (destination, data, options) => {
        contentBeforeWrite = await readFile(destination);
        await writeFile(destination, data, options);
      },
    });

    const result = await storeInitialDocumentsInStagingWithDependencies(
      {
        stagingMatterPath,
        documents: [documentFor("replacement", "a.pdf")],
      },
      dependencies,
    );

    expect(result).toMatchObject({
      ok: false,
      error: "DOCUMENT_WRITE_FAILED",
    });
    expect(contentBeforeWrite).toEqual(Buffer.from("existing"));
  });

  it("does not overwrite a case-insensitive duplicate on Windows", async ({
    skip,
  }) => {
    if (process.platform !== "win32") {
      skip("Case-insensitive filename collision is Windows-specific.");
    }
    let secondWriteExistingContent: Buffer | undefined;
    let writeCount = 0;
    const result = await storeInitialDocumentsInStagingWithDependencies(
      {
        stagingMatterPath,
        documents: [
          documentFor("first", "Case.pdf"),
          documentFor("second", "case.pdf"),
        ],
      },
      dependenciesWith({
        writeFile: async (destination, data, options) => {
          writeCount += 1;
          if (writeCount === 2) {
            secondWriteExistingContent = await readFile(destination);
          }
          await writeFile(destination, data, options);
        },
      }),
    );

    expect(result).toMatchObject({
      ok: false,
      error: "DOCUMENT_WRITE_FAILED",
    });
    expect(secondWriteExistingContent).toEqual(Buffer.from("first"));
    expect(await pathExists(intakePath)).toBe(false);
  });

  it("cleans intake after a first write failure", async () => {
    const result = await storeInitialDocumentsInStagingWithDependencies(
      {
        stagingMatterPath,
        documents: [documentFor("pdf", "a.pdf")],
      },
      dependenciesWith({
        writeFile: async () => {
          throw new Error("injected write failure");
        },
      }),
    );

    expect(result).toEqual({
      ok: false,
      error: "DOCUMENT_WRITE_FAILED",
      cleanupFailed: false,
    });
    expect(await pathExists(intakePath)).toBe(false);
  });

  it("cleans a partially written file when writeFile then throws", async () => {
    const result = await storeInitialDocumentsInStagingWithDependencies(
      {
        stagingMatterPath,
        documents: [documentFor("partial", "a.pdf")],
      },
      dependenciesWith({
        writeFile: async (destination, data) => {
          await writeFile(destination, data, { flag: "w" });
          throw new Error("injected failure after partial write");
        },
      }),
    );

    expect(result).toEqual({
      ok: false,
      error: "DOCUMENT_WRITE_FAILED",
      cleanupFailed: false,
    });
    expect(await pathExists(intakePath)).toBe(false);
  });

  it("cleans prior files after a middle write failure", async () => {
    let writeCount = 0;
    const result = await storeInitialDocumentsInStagingWithDependencies(
      {
        stagingMatterPath,
        documents: [
          documentFor("a", "a.pdf"),
          documentFor("b", "b.pdf"),
          documentFor("c", "c.pdf"),
        ],
      },
      dependenciesWith({
        writeFile: async (destination, data, options) => {
          writeCount += 1;
          if (writeCount === 2) {
            throw new Error("injected middle write failure");
          }
          await writeFile(destination, data, options);
        },
      }),
    );

    expect(result).toEqual({
      ok: false,
      error: "DOCUMENT_WRITE_FAILED",
      cleanupFailed: false,
    });
    expect(writeCount).toBe(2);
    expect(await pathExists(intakePath)).toBe(false);
  });

  it("stops reading and writing after the first failure", async () => {
    const thirdRead = vi.fn(async () => Uint8Array.of(3).buffer);
    const writeFileSpy = vi.fn(
      async (
        destination: string,
        data: Uint8Array,
        options: Readonly<{ flag: "wx" }>,
      ) => {
        if (path.basename(destination) === "b.pdf") {
          throw new Error("injected middle write failure");
        }
        await writeFile(destination, data, options);
      },
    );

    await storeInitialDocumentsInStagingWithDependencies(
      {
        stagingMatterPath,
        documents: [
          documentFor("a", "a.pdf"),
          documentFor("b", "b.pdf"),
          documentWithArrayBuffer("c.pdf", 1, thirdRead),
        ],
      },
      dependenciesWith({ writeFile: writeFileSpy }),
    );

    expect(writeFileSpy).toHaveBeenCalledTimes(2);
    expect(thirdRead).not.toHaveBeenCalled();
  });

  it("calls every successful arrayBuffer exactly once", async () => {
    const firstRead = vi.fn(async () => Uint8Array.of(1).buffer);
    const secondRead = vi.fn(async () => Uint8Array.of(2).buffer);

    const result = await storeInitialDocumentsInStaging({
      stagingMatterPath,
      documents: [
        documentWithArrayBuffer("a.pdf", 1, firstRead),
        documentWithArrayBuffer("b.pdf", 1, secondRead),
      ],
    });

    expect(result).toMatchObject({ ok: true, savedCount: 2 });
    expect(firstRead).toHaveBeenCalledTimes(1);
    expect(secondRead).toHaveBeenCalledTimes(1);
  });

  it("classifies arrayBuffer rejection and cleans intake", async () => {
    const result = await storeInitialDocumentsInStaging({
      stagingMatterPath,
      documents: [
        documentWithArrayBuffer("a.pdf", 1, async () => {
          throw new Error("injected read failure");
        }),
      ],
    });

    expect(result).toEqual({
      ok: false,
      error: "DOCUMENT_READ_FAILED",
      cleanupFailed: false,
    });
    expect(await pathExists(intakePath)).toBe(false);
  });

  it("classifies an object with byteLength as a controlled read failure", async () => {
    const rmSpy = vi.fn(nodeDependencies.rm);
    const result = await storeInitialDocumentsInStagingWithDependencies(
      {
        stagingMatterPath,
        documents: [
          documentWithArrayBuffer(
            "a.pdf",
            1,
            async () =>
              ({ byteLength: 1 }) as unknown as ArrayBuffer,
          ),
        ],
      },
      dependenciesWith({ rm: rmSpy }),
    );

    expect(result).toEqual({
      ok: false,
      error: "DOCUMENT_READ_FAILED",
      cleanupFailed: false,
    });
    expect(rmSpy).toHaveBeenCalledWith(intakePath, {
      recursive: true,
      force: true,
    });
    expect(await pathExists(intakePath)).toBe(false);
  });

  it("classifies a typed-array view as a controlled read failure", async () => {
    const result = await storeInitialDocumentsInStaging({
      stagingMatterPath,
      documents: [
        documentWithArrayBuffer(
          "a.pdf",
          1,
          async () => Uint8Array.of(1) as unknown as ArrayBuffer,
        ),
      ],
    });

    expect(result).toEqual({
      ok: false,
      error: "DOCUMENT_READ_FAILED",
      cleanupFailed: false,
    });
    expect(await pathExists(intakePath)).toBe(false);
  });

  it("classifies Buffer conversion failure and cleans intake", async () => {
    const result = await storeInitialDocumentsInStagingWithDependencies(
      {
        stagingMatterPath,
        documents: [documentFor("pdf", "a.pdf")],
      },
      dependenciesWith({
        bufferFrom: () => {
          throw new Error("injected Buffer conversion failure");
        },
      }),
    );

    expect(result).toEqual({
      ok: false,
      error: "DOCUMENT_READ_FAILED",
      cleanupFailed: false,
    });
    expect(await pathExists(intakePath)).toBe(false);
    expect(await pathExists(stagingMatterPath)).toBe(true);
    expect(await pathExists(ulazPath)).toBe(true);
  });

  it("marks cleanup failure after malformed arrayBuffer output", async () => {
    const result = await storeInitialDocumentsInStagingWithDependencies(
      {
        stagingMatterPath,
        documents: [
          documentWithArrayBuffer(
            "a.pdf",
            1,
            async () =>
              ({ byteLength: 1 }) as unknown as ArrayBuffer,
          ),
        ],
      },
      dependenciesWith({
        rm: async () => {
          throw new Error("injected cleanup failure");
        },
      }),
    );

    expect(result).toEqual({
      ok: false,
      error: "DOCUMENT_READ_FAILED",
      cleanupFailed: true,
    });
    expect(await pathExists(stagingMatterPath)).toBe(true);
    expect(await pathExists(ulazPath)).toBe(true);
    expect(await pathExists(intakePath)).toBe(true);
  });

  it("cleans prior writes after a middle arrayBuffer rejection", async () => {
    const thirdRead = vi.fn(async () => Uint8Array.of(3).buffer);
    const result = await storeInitialDocumentsInStaging({
      stagingMatterPath,
      documents: [
        documentFor("a", "a.pdf"),
        documentWithArrayBuffer("b.pdf", 1, async () => {
          throw new Error("injected middle read failure");
        }),
        documentWithArrayBuffer("c.pdf", 1, thirdRead),
      ],
    });

    expect(result).toEqual({
      ok: false,
      error: "DOCUMENT_READ_FAILED",
      cleanupFailed: false,
    });
    expect(thirdRead).not.toHaveBeenCalled();
    expect(await pathExists(intakePath)).toBe(false);
  });

  it("rejects a byte length mismatch before writing", async () => {
    const writeFileSpy = vi.fn(nodeDependencies.writeFile);
    const result = await storeInitialDocumentsInStagingWithDependencies(
      {
        stagingMatterPath,
        documents: [
          documentWithArrayBuffer(
            "mismatch.pdf",
            999,
            async () => Uint8Array.of(1).buffer,
          ),
        ],
      },
      dependenciesWith({ writeFile: writeFileSpy }),
    );

    expect(result).toEqual({
      ok: false,
      error: "DOCUMENT_SIZE_MISMATCH",
      cleanupFailed: false,
    });
    expect(writeFileSpy).not.toHaveBeenCalled();
    expect(await pathExists(intakePath)).toBe(false);
  });

  it("marks cleanup failure while preserving the primary error", async () => {
    const result = await storeInitialDocumentsInStagingWithDependencies(
      {
        stagingMatterPath,
        documents: [
          documentWithArrayBuffer("a.pdf", 1, async () => {
            throw new Error("injected read failure");
          }),
        ],
      },
      dependenciesWith({
        rm: async () => {
          throw new Error("injected cleanup failure");
        },
      }),
    );

    expect(result).toEqual({
      ok: false,
      error: "DOCUMENT_READ_FAILED",
      cleanupFailed: true,
    });
    expect(await pathExists(stagingMatterPath)).toBe(true);
    expect(await pathExists(ulazPath)).toBe(true);
  });

  it("rejects an invalid size contract before filesystem mutation", async () => {
    const file = new File(["pdf"], "a.pdf");
    const result = await storeInitialDocumentsInStaging({
      stagingMatterPath,
      documents: [{ file, normalizedName: "a.pdf", size: -1 }],
    });

    expect(result).toEqual({
      ok: false,
      error: "INVALID_DOCUMENT_CONTRACT",
      cleanupFailed: false,
    });
    expect(await pathExists(intakePath)).toBe(false);
  });

  it("does not expose paths or filenames in an error result", async () => {
    await rm(stagingMatterPath, { recursive: true, force: true });
    const privateName = "private-client.pdf";
    const result = await storeInitialDocumentsInStaging({
      stagingMatterPath,
      documents: [documentFor("pdf", privateName)],
    });
    const serialized = JSON.stringify(result);

    expect(serialized).not.toContain(stagingMatterPath);
    expect(serialized).not.toContain(privateName);
  });

  it("keeps staging matter and 01 ULAZ after successful cleanup", async () => {
    await storeInitialDocumentsInStagingWithDependencies(
      {
        stagingMatterPath,
        documents: [documentFor("pdf", "a.pdf")],
      },
      dependenciesWith({
        writeFile: async () => {
          throw new Error("injected write failure");
        },
      }),
    );

    expect(await pathExists(stagingMatterPath)).toBe(true);
    expect(await pathExists(ulazPath)).toBe(true);
    expect(await pathExists(intakePath)).toBe(false);
  });
});
