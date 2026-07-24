import "server-only";

import {
  appendFile,
  readFile,
  realpath,
  stat,
  unlink,
  writeFile,
} from "node:fs/promises";
import path from "node:path";
import type {
  MatterCommandCenterMetadata,
  ResolvedActiveMatter,
} from "@/lib/sdj-matters";

export const MAX_ADDITIONAL_CONTEXT_LENGTH = 8_000;

export const PROMPT_TYPES = [
  { slug: "INTAKE_AGENT", label: "Intake Agent" },
  { slug: "CONTRACT_AGENT", label: "Contract Agent" },
  { slug: "LITIGATION_AGENT", label: "Litigation Agent" },
  { slug: "CLIENT_EMAIL_AGENT", label: "Client Email Agent" },
  { slug: "CLAUDE_REVIEW", label: "Claude Review" },
  { slug: "TABULAR_REVIEW_LITE", label: "Tabular Review Lite" },
] as const;

export type PromptTypeSlug = (typeof PROMPT_TYPES)[number]["slug"];

export type PromptGeneratorInput = {
  clientFolder: string;
  matterFolder: string;
  promptType: PromptTypeSlug;
  additionalContext: string;
};

export type PromptGenerationInput = Pick<
  PromptGeneratorInput,
  "promptType" | "additionalContext"
> & {
  metadata: MatterCommandCenterMetadata;
};

export type SaveGeneratedPromptInput = PromptGenerationInput & {
  resolvedMatter: ResolvedActiveMatter;
};

export type SavedPromptResult = {
  fileName: string;
  relativePath: string;
  promptType: {
    slug: PromptTypeSlug;
    label: string;
  };
};

export class PromptInputValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PromptInputValidationError";
  }
}

export const SAVE_PROMPT_ERROR_CODES = [
  "TARGET_UNAVAILABLE",
  "NAMES_EXHAUSTED",
  "SAVE_FAILED",
  "ROLLBACK_FAILED",
] as const;

export type SavePromptErrorCode =
  (typeof SAVE_PROMPT_ERROR_CODES)[number];

export class SavePromptError extends Error {
  readonly code: SavePromptErrorCode;

  constructor(code: SavePromptErrorCode) {
    super("Prompt save operation failed.");
    this.name = "SavePromptError";
    this.code = code;
  }
}

const PROMPT_TYPE_SLUGS = new Set<PromptTypeSlug>(
  PROMPT_TYPES.map(({ slug }) => slug),
);

const REQUEST_KEYS = new Set<keyof PromptGeneratorInput>([
  "clientFolder",
  "matterFolder",
  "promptType",
  "additionalContext",
]);

const WINDOWS_INVALID_SEGMENT_CHARACTERS =
  /[<>:"/\\|?*\u0000-\u001f\u007f]/;
const WINDOWS_DEVICE_NAME =
  /^(?:CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])(?:\..*)?$/i;
const WINDOWS_ABSOLUTE_PATH =
  /(?:[a-z]:[\\/]|\\\\)[^\r\n|]*/gi;
const INTERNAL_PATH_TERMS =
  /\b(?:workspace\s*root|matterPath|controlPath|aiPath|activeRootPath|allowedTestRoot|OneDrive)\b/gi;
const FORBIDDEN_CONTROL_CHARACTERS =
  /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g;

const CLAUDE_DRAFT_PLACEHOLDER =
  "<<< OVDE RUČNO NALEPITE AI NACRT ZA PROVERU >>>";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isPlainWindowsFolderSegment(value: string) {
  return (
    value.length > 0 &&
    value.length <= 180 &&
    value === value.trim() &&
    value !== "." &&
    value !== ".." &&
    !value.endsWith(".") &&
    !WINDOWS_INVALID_SEGMENT_CHARACTERS.test(value) &&
    !WINDOWS_DEVICE_NAME.test(value) &&
    !/^[a-z]:/i.test(value)
  );
}

function requireFolderSegment(
  value: unknown,
  field: "clientFolder" | "matterFolder",
) {
  if (typeof value !== "string" || !isPlainWindowsFolderSegment(value)) {
    throw new PromptInputValidationError(
      field === "clientFolder"
        ? "Izabrani klijent nije validan."
        : "Izabrani predmet nije validan.",
    );
  }
  if (field === "matterFolder" && !value.startsWith("SDJ_")) {
    throw new PromptInputValidationError("Izabrani predmet nije aktivan.");
  }
  return value;
}

function requirePromptType(value: unknown): PromptTypeSlug {
  if (
    typeof value !== "string" ||
    !PROMPT_TYPE_SLUGS.has(value as PromptTypeSlug)
  ) {
    throw new PromptInputValidationError("Izabrani prompt tip nije validan.");
  }
  return value as PromptTypeSlug;
}

export function normalizeAdditionalContext(value: string) {
  const normalizedLines = value
    .replace(/\r\n?/g, "\n")
    .replace(FORBIDDEN_CONTROL_CHARACTERS, "")
    .split("\n")
    .map((line) => line.replace(/[\t ]+/g, " ").trim());

  const normalized = normalizedLines
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  if (normalized.length > MAX_ADDITIONAL_CONTEXT_LENGTH) {
    throw new PromptInputValidationError(
      `Dodatni kontekst može imati najviše ${MAX_ADDITIONAL_CONTEXT_LENGTH} znakova.`,
    );
  }

  return normalized;
}

export function parsePromptGeneratorInput(
  payload: unknown,
): PromptGeneratorInput {
  if (!isRecord(payload)) {
    throw new PromptInputValidationError("Zahtev nije validan.");
  }
  if (
    Object.keys(payload).some(
      (key) => !REQUEST_KEYS.has(key as keyof PromptGeneratorInput),
    )
  ) {
    throw new PromptInputValidationError(
      "Zahtev sadrži nedozvoljena polja.",
    );
  }
  if (
    !Object.hasOwn(payload, "clientFolder") ||
    !Object.hasOwn(payload, "matterFolder") ||
    !Object.hasOwn(payload, "promptType") ||
    !Object.hasOwn(payload, "additionalContext")
  ) {
    throw new PromptInputValidationError(
      "Zahtev ne sadrži sva obavezna polja.",
    );
  }
  if (typeof payload.additionalContext !== "string") {
    throw new PromptInputValidationError(
      "Dodatni kontekst mora biti tekst.",
    );
  }

  return {
    clientFolder: requireFolderSegment(payload.clientFolder, "clientFolder"),
    matterFolder: requireFolderSegment(payload.matterFolder, "matterFolder"),
    promptType: requirePromptType(payload.promptType),
    additionalContext: normalizeAdditionalContext(payload.additionalContext),
  };
}

function safePromptText(value: string | null) {
  if (!value?.trim()) return "Nije navedeno.";
  return value
    .replace(WINDOWS_ABSOLUTE_PATH, "[lokalna putanja nije uključena]")
    .replace(INTERNAL_PATH_TERMS, "[server-side podatak nije uključen]")
    .replace(FORBIDDEN_CONTROL_CHARACTERS, "")
    .replace(/\r\n?/g, "\n")
    .trim();
}

function promptTypeLabel(promptType: PromptTypeSlug) {
  return (
    PROMPT_TYPES.find(({ slug }) => slug === promptType)?.label ??
    promptType
  );
}

function matterDetails(metadata: MatterCommandCenterMetadata) {
  return [
    `Klijent: ${safePromptText(metadata.client)}`,
    `Predmet: ${safePromptText(metadata.matter)}`,
    `Datum otvaranja: ${safePromptText(metadata.openedAt)}`,
    `Oblast prava: ${safePromptText(metadata.legalArea)}`,
    `Status: ${safePromptText(metadata.status)}`,
    `Prioritet: ${safePromptText(metadata.priority)}`,
    `Rok: ${safePromptText(metadata.deadline)}`,
    `Kratak opis: ${safePromptText(metadata.shortDescription)}`,
    `Ključna pitanja: ${safePromptText(metadata.keyQuestions)}`,
    `Evidentirani rizici: ${safePromptText(metadata.risks)}`,
    `Sledeći korak: ${safePromptText(metadata.nextStep)}`,
    `Čeka se od: ${safePromptText(metadata.waitingFor)}`,
    `Detalj čekanja: ${safePromptText(metadata.waitingDetail)}`,
    `Očekivani output: ${safePromptText(metadata.expectedOutput)}`,
    `Finalni cilj: ${safePromptText(metadata.finalGoal)}`,
  ].join("\n");
}

function additionalContextSection(additionalContext: string) {
  return additionalContext
    ? safePromptText(additionalContext)
    : "Nije dodat poseban kontekst.";
}

function taskInstructions(promptType: PromptTypeSlug) {
  switch (promptType) {
    case "INTAKE_AGENT":
      return [
        "Sistematizuj dostavljene informacije kao početni pravni intake.",
        "Razdvoji poznate činjenice od navoda koje tek treba proveriti.",
        "Identifikuj učesnike, cilj klijenta, potencijalne rokove, potrebne dokumente i naredna pitanja za klijenta.",
        "Ne donosi konačan pravni zaključak kada činjenice ili dokumentacija nisu potpuni.",
      ].join("\n");
    case "CONTRACT_AGENT":
      return [
        "Pripremi pravno strukturisan okvir za pregled ugovornog pitanja.",
        "Izdvoji relevantne ugovorne obaveze, prava, uslove, rokove, odgovornost, raskid, obezbeđenja i sporne formulacije samo ako su navedeni u dostavljenim podacima.",
        "Predloži pitanja i tačke koje advokat treba da proveri u samom ugovoru.",
        "Ne tvrdi da je ugovor pregledan ako njegov tekst nije ručno dostavljen u ovom promptu.",
      ].join("\n");
    case "LITIGATION_AGENT":
      return [
        "Pripremi radni okvir za analizu spora ili postupka.",
        "Odvoji procesne činjenice, materijalnopravna pitanja, dokazne potrebe, rokove i moguće procesne rizike.",
        "Navedi koje navode, isprave, dostave i procesne pretpostavke advokat mora dodatno proveriti.",
        "Ne izmišljaj sadržaj spisa, odluka, podnesaka ili dokaza.",
      ].join("\n");
    case "CLIENT_EMAIL_AGENT":
      return [
        "Pripremi profesionalan i razumljiv nacrt emaila klijentu.",
        "Ton treba da bude smiren, precizan i primeren komunikaciji advokata sa klijentom.",
        "Odvojeno prikaži predlog naslova, telo poruke, tražene priloge ili informacije i internu napomenu pre slanja.",
        "Ne obećavaj ishod i ne navodi rok ili činjenicu koja nije potvrđena.",
      ].join("\n");
    case "CLAUDE_REVIEW":
      return [
        "Kritički proveri ručno priloženi AI nacrt u odnosu na podatke predmeta.",
        "Identifikuj činjenične skokove, pravne i praktične rizike, nedoslednosti, nejasnoće i tvrdnje bez oslonca.",
        "Predloži precizne korekcije, ali jasno odvoji provereno od onoga što zahteva advokatsku potvrdu.",
        CLAUDE_DRAFT_PLACEHOLDER,
      ].join("\n\n");
    case "TABULAR_REVIEW_LITE":
      return [
        "Ne analiziraj niti tvrdi da si pročitao bilo koji dokument koji nije ručno unet u ovaj prompt.",
        "Na osnovu isključivo navedenih podataka pripremi samo sledeće Markdown tabele:",
        "1. Rizici",
        "2. Klauzule",
        "3. Obaveze",
        "4. Rokovi",
        "5. Otvorena pitanja",
        "Ako za tabelu nema dovoljno podataka, unesi red koji jasno kaže da podatak nedostaje.",
      ].join("\n");
  }
}

function responseFormat(promptType: PromptTypeSlug) {
  if (promptType === "TABULAR_REVIEW_LITE") {
    return [
      "Vrati isključivo pet traženih Markdown tabela, sa kratkim i jasnim nazivima kolona.",
      "Ne dodaj narativnu analizu izvan tabela.",
    ].join("\n");
  }
  if (promptType === "CLIENT_EMAIL_AGENT") {
    return [
      "Koristi kratke pasuse i jasne naslove: Predlog naslova, Telo emaila, Predloženi prilozi / informacije i Napomena pre slanja.",
      "Tekst mora biti spreman za ručno kopiranje u email, ali ne i automatsko slanje.",
    ].join("\n");
  }
  return [
    "Koristi kratke pasuse i jasne naslove pogodne za kopiranje u Word.",
    "Zaključke poveži sa navedenim činjenicama i jasno označi stepen sigurnosti.",
    "Na kraju obavezno prikaži odvojene sekcije za nedostajuće informacije, rizike i pretpostavke.",
  ].join("\n");
}

function sharedClosingSections() {
  return [
    "# Nedostajuće informacije",
    "Navedi sve činjenice, dokumente, datume, iznose, uloge učesnika i pravne izvore koji nedostaju za pouzdan odgovor.",
    "",
    "# Pravni i praktični rizici",
    "Navedi pravne, procesne, dokazne, komercijalne i praktične rizike koji proizlaze samo iz dostavljenih podataka. Razdvoji potvrđene rizike od mogućih rizika.",
    "",
    "# Pretpostavke koje zahtevaju potvrdu",
    "Nabroj svaku pretpostavku na kojoj odgovor počiva i objasni šta advokat treba da potvrdi.",
    "",
    "# Obavezna ograničenja",
    "Ne izmišljaj činjenice, dokumente, citate, pravne izvore, rokove, iznose, komunikaciju ili procesne događaje.",
    "Ako podatak nije dostavljen, označi ga kao nedostajući umesto da ga pretpostaviš.",
    "Rezultat označi sa: AI NACRT — NIJE ODOBRENO.",
    "Rezultat predstavlja radni AI nacrt i zahteva pregled i odobrenje advokata pre bilo kakve upotrebe.",
  ].join("\n");
}

export function generateWordReadyPrompt({
  metadata,
  promptType,
  additionalContext,
}: PromptGenerationInput) {
  const normalizedContext = normalizeAdditionalContext(additionalContext);

  return [
    `# ${promptTypeLabel(promptType)}`,
    "",
    "# Uloga i cilj",
    "Postupaj kao pažljiv pravni radni asistent. Pripremi strukturisan nacrt koji advokatu pomaže u daljem radu, bez predstavljanja rezultata kao konačnog pravnog mišljenja.",
    "",
    "# Podaci o predmetu",
    matterDetails(metadata),
    "",
    "# Dodatni kontekst",
    additionalContextSection(normalizedContext),
    "",
    "# Zadatak",
    taskInstructions(promptType),
    "",
    "# Zahtevani format odgovora",
    responseFormat(promptType),
    "",
    sharedClosingSections(),
  ].join("\n");
}

export function generateClaudeReviewPrompt({
  metadata,
  additionalContext,
}: Omit<PromptGenerationInput, "promptType">) {
  return generateWordReadyPrompt({
    metadata,
    promptType: "CLAUDE_REVIEW",
    additionalContext,
  });
}

function sameWindowsPath(left: string, right: string) {
  return (
    path.win32.normalize(left).toLocaleLowerCase("en-US") ===
    path.win32.normalize(right).toLocaleLowerCase("en-US")
  );
}

function isDirectWindowsChild(parent: string, candidate: string) {
  const relative = path.win32.relative(
    path.win32.normalize(parent).toLocaleLowerCase("en-US"),
    path.win32.normalize(candidate).toLocaleLowerCase("en-US"),
  );
  return (
    relative.length > 0 &&
    relative !== "." &&
    relative !== ".." &&
    !relative.startsWith(`..${path.win32.sep}`) &&
    !path.win32.isAbsolute(relative) &&
    !relative.includes(path.win32.sep)
  );
}

async function requireSafeDirectory(parent: string, candidate: string) {
  try {
    const [realParent, realCandidate] = await Promise.all([
      realpath(parent),
      realpath(candidate),
    ]);
    const info = await stat(realCandidate);
    if (
      !info.isDirectory() ||
      !isDirectWindowsChild(realParent, realCandidate)
    ) {
      throw new SavePromptError("TARGET_UNAVAILABLE");
    }
    return realCandidate;
  } catch (error) {
    if (error instanceof SavePromptError) throw error;
    throw new SavePromptError("TARGET_UNAVAILABLE");
  }
}

async function requireSafeLogFile(
  controlPath: string,
  logCandidate: string,
) {
  try {
    const realLogPath = await realpath(logCandidate);
    const info = await stat(realLogPath);
    if (
      !info.isFile() ||
      !isDirectWindowsChild(controlPath, realLogPath)
    ) {
      throw new SavePromptError("TARGET_UNAVAILABLE");
    }
    return realLogPath;
  } catch (error) {
    if (error instanceof SavePromptError) throw error;
    throw new SavePromptError("TARGET_UNAVAILABLE");
  }
}

function localIsoDate(date = new Date()) {
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function candidateFileName(
  date: string,
  promptType: PromptTypeSlug,
  index: number,
) {
  const suffix =
    index === 0 ? "" : `_${String(index + 1).padStart(3, "0")}`;
  return `${date}_prompt_${promptType}${suffix}.md`;
}

function safeLogCell(value: string) {
  return value
    .replace(/\|/g, "/")
    .replace(/[\u0000-\u001f\u007f]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function logAppendText(
  existingLog: string,
  date: string,
  promptType: string,
  relativePath: string,
) {
  const lineEnding = existingLog.includes("\r\n") ? "\r\n" : "\n";
  const separator =
    existingLog.length > 0 && !/[\r\n]$/.test(existingLog)
      ? lineEnding
      : "";
  const row = [
    date,
    "SDJ MIKE",
    promptType,
    relativePath,
    "Prompt generisan i sačuvan",
  ]
    .map(safeLogCell)
    .join(" | ");
  return `${separator}${row}${lineEnding}`;
}

async function reservePromptFile(
  aiPath: string,
  date: string,
  promptType: PromptTypeSlug,
  prompt: string,
) {
  for (let index = 0; index <= 998; index += 1) {
    const fileName = candidateFileName(date, promptType, index);
    const candidate = path.win32.join(aiPath, fileName);
    if (!isDirectWindowsChild(aiPath, candidate)) {
      throw new SavePromptError("SAVE_FAILED");
    }
    try {
      await writeFile(candidate, prompt, {
        encoding: "utf8",
        flag: "wx",
      });
      return { fileName, filePath: candidate };
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "EEXIST") continue;
      throw new SavePromptError("SAVE_FAILED");
    }
  }
  throw new SavePromptError("NAMES_EXHAUSTED");
}

export async function saveGeneratedPrompt({
  resolvedMatter,
  metadata,
  promptType,
  additionalContext,
}: SaveGeneratedPromptInput): Promise<SavedPromptResult> {
  const realMatterPath = await requireSafeDirectory(
    resolvedMatter.clientPath,
    resolvedMatter.matterPath,
  );
  const [realControlPath, realAiPath] = await Promise.all([
    requireSafeDirectory(realMatterPath, resolvedMatter.controlPath),
    requireSafeDirectory(realMatterPath, resolvedMatter.aiPath),
  ]);
  if (
    !sameWindowsPath(
      path.win32.join(realMatterPath, "00 CONTROL"),
      realControlPath,
    ) ||
    !sameWindowsPath(path.win32.join(realMatterPath, "04 AI"), realAiPath)
  ) {
    throw new SavePromptError("TARGET_UNAVAILABLE");
  }

  const logPath = await requireSafeLogFile(
    realControlPath,
    path.win32.join(realControlPath, "ai-work-log.md"),
  );

  let existingLog: string;
  try {
    existingLog = await readFile(logPath, "utf8");
  } catch {
    throw new SavePromptError("TARGET_UNAVAILABLE");
  }

  const prompt = generateWordReadyPrompt({
    metadata,
    promptType,
    additionalContext,
  });
  const date = localIsoDate();
  const promptTypeDefinition = PROMPT_TYPES.find(
    ({ slug }) => slug === promptType,
  );
  if (!promptTypeDefinition) {
    throw new SavePromptError("SAVE_FAILED");
  }

  const createdPrompt = await reservePromptFile(
    realAiPath,
    date,
    promptType,
    prompt,
  );
  const relativePath = `04 AI/${createdPrompt.fileName}`;

  try {
    await appendFile(
      logPath,
      logAppendText(
        existingLog,
        date,
        promptTypeDefinition.label,
        relativePath,
      ),
      { encoding: "utf8" },
    );
  } catch {
    try {
      await unlink(createdPrompt.filePath);
    } catch {
      throw new SavePromptError("ROLLBACK_FAILED");
    }
    throw new SavePromptError("SAVE_FAILED");
  }

  return {
    fileName: createdPrompt.fileName,
    relativePath,
    promptType: {
      slug: promptTypeDefinition.slug,
      label: promptTypeDefinition.label,
    },
  };
}
