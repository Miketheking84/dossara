"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";

type PreviewKind = "docx" | "image" | "pdf" | "text" | "unsupported";

type FileTreeNode = {
  name: string;
  relativePath: string;
  kind: "directory" | "file";
  children?: FileTreeNode[];
  extension?: string;
  size?: number;
  previewKind?: PreviewKind;
  canPreview?: boolean;
};

type FileTreeResult = {
  nodes: FileTreeNode[];
  totalFiles: number;
  totalFolders: number;
  truncated: boolean;
  warnings: string[];
};

function formatSize(size = 0) {
  if (size >= 1024 * 1024) return `${(size / (1024 * 1024)).toFixed(1)} MiB`;
  if (size >= 1024) return `${(size / 1024).toFixed(1)} KiB`;
  return `${size} B`;
}

function countTreeNodes(nodes: FileTreeNode[]) {
  let files = 0;
  let folders = 0;
  for (const node of nodes) {
    if (node.kind === "file") {
      files += 1;
    } else {
      folders += 1;
      const childCounts = countTreeNodes(node.children ?? []);
      files += childCounts.files;
      folders += childCounts.folders;
    }
  }
  return { files, folders };
}

function TreeNodes({
  nodes,
  selectedPath,
  onSelect,
  depth = 0,
}: {
  nodes: FileTreeNode[];
  selectedPath: string | null;
  onSelect: (file: FileTreeNode) => void;
  depth?: number;
}) {
  return (
    <ul className="matter-file-tree-list" data-depth={depth}>
      {nodes.map((node) => (
        <li key={node.relativePath}>
          {node.kind === "directory" ? (
            <details open={depth === 0}>
              <summary>
                <span aria-hidden="true">▸</span>
                <strong>{node.name}</strong>
                <small>{node.children?.length ?? 0}</small>
              </summary>
              {node.children?.length ? (
                <TreeNodes
                  nodes={node.children}
                  selectedPath={selectedPath}
                  onSelect={onSelect}
                  depth={depth + 1}
                />
              ) : null}
            </details>
          ) : (
            <button
              type="button"
              className={selectedPath === node.relativePath ? "selected" : ""}
              onClick={() => onSelect(node)}
              title={node.relativePath}
            >
              <span aria-hidden="true">▤</span>
              <span>{node.name}</span>
              <small>{formatSize(node.size)}</small>
            </button>
          )}
        </li>
      ))}
    </ul>
  );
}

export function MatterFileBrowser({
  clientFolder,
  matterFolder,
  initialTree,
}: {
  clientFolder: string;
  matterFolder: string;
  initialTree: FileTreeResult;
}) {
  const t = useTranslations("MatterFiles");
  const [tree, setTree] = useState(initialTree);
  const [selected, setSelected] = useState<FileTreeNode | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [opening, setOpening] = useState(false);
  const [openingMatter, setOpeningMatter] = useState(false);
  const [showControlFiles, setShowControlFiles] = useState(false);
  const [textPreview, setTextPreview] = useState({ url: "", text: "", error: "" });

  const visibleTree = useMemo(() => {
    const nodes = showControlFiles
      ? tree.nodes
      : tree.nodes.filter((node) => node.name !== "00 CONTROL");
    return { nodes, ...countTreeNodes(nodes) };
  }, [showControlFiles, tree.nodes]);

  const fileQuery = useMemo(() => {
    if (!selected) return "";
    const query = new URLSearchParams({
      clientFolder,
      matterFolder,
      relativePath: selected.relativePath,
    });
    return `/api/matters/file?${query.toString()}`;
  }, [clientFolder, matterFolder, selected]);

  useEffect(() => {
    const shouldLoadText = selected?.canPreview &&
      (selected.previewKind === "docx" || selected.previewKind === "text");
    if (!shouldLoadText || !fileQuery) return;
    const controller = new AbortController();
    fetch(fileQuery, { cache: "no-store", signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error(t("previewLoadFailed"));
        return response.text();
      })
      .then((text) => setTextPreview({ url: fileQuery, text, error: "" }))
      .catch((error) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setTextPreview({
          url: fileQuery,
          text: "",
          error: error instanceof Error ? error.message : t("previewLoadFailed"),
        });
      });
    return () => controller.abort();
  }, [fileQuery, selected, t]);

  async function refreshTree() {
    setLoading(true);
    setMessage("");
    try {
      const query = new URLSearchParams({ clientFolder, matterFolder });
      const response = await fetch(`/api/matters/files?${query.toString()}`, {
        cache: "no-store",
      });
      const data = (await response.json()) as FileTreeResult & { error?: string };
      if (!response.ok) throw new Error(data.error || t("loadFailed"));
      setTree(data);
      setSelected(null);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : t("loadFailed"));
    } finally {
      setLoading(false);
    }
  }

  async function openLocally() {
    if (!selected) return;
    setOpening(true);
    setMessage("");
    try {
      const response = await fetch("/api/matters/file", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientFolder,
          matterFolder,
          relativePath: selected.relativePath,
        }),
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(data.error || t("openFailed"));
      setMessage(t("openedLocally"));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : t("openFailed"));
    } finally {
      setOpening(false);
    }
  }

  async function openMatterInWindows() {
    setOpeningMatter(true);
    setMessage("");
    try {
      const response = await fetch("/api/matters/open-folder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientFolder, matterFolder, target: "matter" }),
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(data.error || t("openMatterFailed"));
      setMessage(t("matterOpenedInWindows"));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : t("openMatterFailed"));
    } finally {
      setOpeningMatter(false);
    }
  }

  function toggleControlFiles() {
    setShowControlFiles((current) => !current);
    if (selected?.relativePath.startsWith("00 CONTROL/")) setSelected(null);
  }

  return (
    <section className="work-panel matter-files-panel">
      <div className="panel-heading matter-files-heading">
        <div>
          <h2>{t("title")}</h2>
          <p>{t("description")}</p>
        </div>
        <div className="matter-file-counts" aria-label={t("countsLabel")}>
          <span>{t("folderCount", { count: visibleTree.folders })}</span>
          <span>{t("fileCount", { count: visibleTree.files })}</span>
          <button type="button" onClick={toggleControlFiles}>
            {showControlFiles ? t("hideControlFiles") : t("showControlFiles")}
          </button>
          <button type="button" onClick={refreshTree} disabled={loading}>
            {loading ? t("refreshing") : t("refresh")}
          </button>
          <button className="windows-folder-action" type="button" onClick={openMatterInWindows} disabled={openingMatter}>
            {openingMatter ? t("openingMatter") : t("openMatterInWindows")}
          </button>
        </div>
      </div>

      {message ? <p className="matter-files-message" role="status">{message}</p> : null}
      {tree.truncated ? <p className="matter-files-warning">{t("truncated")}</p> : null}
      {tree.warnings.length ? <p className="matter-files-warning">{t("unsafeSkipped", { count: tree.warnings.length })}</p> : null}

      <div className="matter-files-layout">
        <nav className="matter-file-tree" aria-label={t("treeLabel")}>
          {visibleTree.nodes.length ? (
            <TreeNodes
              nodes={visibleTree.nodes}
              selectedPath={selected?.relativePath ?? null}
              onSelect={setSelected}
            />
          ) : (
            <p>{t("empty")}</p>
          )}
        </nav>

        <section className="matter-file-preview" aria-label={t("previewLabel")}>
          {selected ? (
            <>
              <header>
                <div>
                  <strong>{selected.name}</strong>
                  <span>{selected.relativePath}</span>
                </div>
                <button type="button" onClick={openLocally} disabled={opening}>
                  {opening ? t("opening") : t("openLocally")}
                </button>
              </header>
              <div className="matter-file-preview-body">
                {selected.canPreview && selected.previewKind === "image" ? (
                  // The source is a guarded loopback route scoped to this matter.
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={fileQuery} alt={selected.name} />
                ) : selected.canPreview && (selected.previewKind === "docx" || selected.previewKind === "text") ? (
                  textPreview.url !== fileQuery ? (
                    <div className="matter-file-preview-empty"><strong>{t("previewLoading")}</strong></div>
                  ) : textPreview.error ? (
                    <div className="matter-file-preview-empty"><strong>{textPreview.error}</strong></div>
                  ) : (
                    <pre className="matter-file-text-preview">{textPreview.text}</pre>
                  )
                ) : selected.canPreview ? (
                  <iframe key={fileQuery} src={fileQuery} title={t("previewTitle", { name: selected.name })} />
                ) : (
                  <div className="matter-file-preview-empty">
                    <strong>{t("previewUnavailable")}</strong>
                    <p>{t("previewUnavailableHelp")}</p>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="matter-file-preview-empty">
              <strong>{t("selectFile")}</strong>
              <p>{t("selectFileHelp")}</p>
            </div>
          )}
        </section>
      </div>
    </section>
  );
}
