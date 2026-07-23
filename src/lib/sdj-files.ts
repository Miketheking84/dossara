import path from "node:path";

export const MATTER_FOLDERS = ["00 CONTROL", "01 ULAZ", "02 RADNO", "03 FINALNO", "04 AI"] as const;
export const CONTROL_FILES = ["command-center.md", "chronology.md", "next-actions.md", "document-register.md", "ai-work-log.md"] as const;

const TRANSLITERATION: Record<string, string> = { č: "c", ć: "c", š: "s", ž: "z", đ: "dj", Č: "C", Ć: "C", Š: "S", Ž: "Z", Đ: "DJ" };

export function sanitizeFolderPart(value: string, maxLength = 60) {
  const transliterated = [...value].map((char) => TRANSLITERATION[char] ?? char).join("");
  return transliterated
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[<>:"/\\|?*\u0000-\u001F]/g, " ")
    .trim().toUpperCase().replace(/[. ]+$/g, "")
    .replace(/\s+/g, "_").replace(/_+/g, "_")
    .slice(0, maxLength).replace(/_+$/g, "");
}

export function makeMatterFolderName(date: string, client: string, matter: string) {
  return `SDJ_${date}_${sanitizeFolderPart(client, 40)}_${sanitizeFolderPart(matter, 60)}`.slice(0, 140).replace(/_+$/g, "");
}

export function isSafeDirectChild(parent: string, candidate: string) {
  const relative = path.win32.relative(parent, candidate);
  return relative !== "" && !relative.startsWith("..") && !path.win32.isAbsolute(relative) && !relative.includes(path.win32.sep);
}

export function markdownValue(value: unknown) {
  return String(value ?? "").replace(/\r?\n/g, " ").trim();
}
