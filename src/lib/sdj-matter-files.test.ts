import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  MatterFileAccessError,
  listMatterFileTreeAtRoot,
  normalizeMatterRelativePath,
  resolveMatterFileAtRoot,
} from "./sdj-matter-files";

vi.mock("server-only", () => ({}));
vi.mock("./sdj-matters", () => ({ resolveActiveMatter: vi.fn() }));

const cleanup: string[] = [];

afterEach(async () => {
  await Promise.all(
    cleanup.splice(0).map((directory) =>
      rm(directory, { force: true, recursive: true }),
    ),
  );
});

async function makeMatterFixture() {
  const root = await mkdtemp(path.join(os.tmpdir(), "sdj-matter-files-"));
  cleanup.push(root);
  await mkdir(path.join(root, "00 CONTROL"));
  await mkdir(path.join(root, "01 ULAZ", "Podfolder"), { recursive: true });
  await writeFile(path.join(root, "00 CONTROL", "command-center.md"), "# Test");
  await writeFile(path.join(root, "01 ULAZ", "Dokument.pdf"), "pdf");
  await writeFile(path.join(root, "01 ULAZ", "Podfolder", "Napomena.txt"), "tekst");
  return root;
}

describe("matter file tree", () => {
  it("lists nested local folders and files with preview metadata", async () => {
    const root = await makeMatterFixture();
    const result = await listMatterFileTreeAtRoot(root);

    expect(result.totalFolders).toBe(3);
    expect(result.totalFiles).toBe(3);
    expect(result.truncated).toBe(false);
    expect(result.warnings).toEqual([]);
    expect(result.nodes.map((node) => node.name)).toEqual(["00 CONTROL", "01 ULAZ"]);
    const inputFolder = result.nodes[1];
    expect(inputFolder.children?.map((node) => node.name)).toEqual([
      "Podfolder",
      "Dokument.pdf",
    ]);
    expect(inputFolder.children?.[1]).toMatchObject({
      previewKind: "pdf",
      canPreview: true,
      relativePath: "01 ULAZ/Dokument.pdf",
    });
  });

  it("resolves only files that remain inside the matter root", async () => {
    const root = await makeMatterFixture();
    const file = await resolveMatterFileAtRoot(
      root,
      "01 ULAZ/Podfolder/Napomena.txt",
    );
    expect(file.previewKind).toBe("text");
    expect(file.relativePath).toBe("01 ULAZ/Podfolder/Napomena.txt");

    await expect(resolveMatterFileAtRoot(root, "../izvan.txt")).rejects.toBeInstanceOf(
      MatterFileAccessError,
    );
  });

  it.each(["", "..\\tajna.txt", "01 ULAZ\\..\\tajna.txt", "C:\\tajna.txt"])(
    "rejects unsafe relative path %j",
    (value) => {
      expect(() => normalizeMatterRelativePath(value)).toThrow(MatterFileAccessError);
    },
  );
});
