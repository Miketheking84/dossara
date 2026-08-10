import { lstat, readFile, realpath, rename, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import {
  MATTER_WORK_FIELD_KEYS,
  MATTER_WORK_PRIORITIES,
  MATTER_WORK_STATUSES,
  MATTER_WORK_WAITING_OPTIONS,
  type MatterWorkFieldKey,
  type MatterWorkValues,
} from "./sdj-work-fields";

const MAX_COMMAND_CENTER_BYTES = 1024 * 1024;

const COMMAND_CENTER_LABELS: readonly [string, string][] = [
  ["Klijent", "client"],
  ["Predmet", "matter"],
  ["Datum otvaranja", "openedAt"],
  ["Status", "status"],
  ["Prioritet", "priority"],
  ["Oblast prava", "legalArea"],
  ["Sledeći korak", "nextStep"],
  ["Čeka se od", "waitingFor"],
  ["Detalj čekanja / napomena", "waitingDetail"],
  ["Rok", "deadline"],
  ["Kratak opis", "shortDescription"],
  ["Ključna pitanja", "keyQuestions"],
  ["Rizici", "risks"],
  ["Očekivani output", "expectedOutput"],
  ["Status outputa", "outputStatus"],
  ["Finalni dokument", "finalDocument"],
  ["Finalni cilj", "finalGoal"],
] as const;

const LABEL_BY_WORK_FIELD: Record<MatterWorkFieldKey, string> = {
  status: "Status",
  priority: "Prioritet",
  nextStep: "Sledeći korak",
  waitingFor: "Čeka se od",
  waitingDetail: "Detalj čekanja / napomena",
  deadline: "Rok",
};

const KNOWN_LABELS = new Set(COMMAND_CENTER_LABELS.map(([label]) => label));

export class MatterWorkUpdateError extends Error {
  readonly code: "INVALID_INPUT" | "UNSAFE_FILE" | "FILE_TOO_LARGE" | "WRITE_FAILED";

  constructor(code: MatterWorkUpdateError["code"], message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = "MatterWorkUpdateError";
    this.code = code;
  }
}

function normalizeSingleLine(value: unknown, maxLength: number) {
  if (typeof value !== "string") {
    throw new MatterWorkUpdateError("INVALID_INPUT", "Vrijednost polja nije validna.");
  }
  const normalized = value.replace(/\s+/g, " ").trim();
  if (normalized.length > maxLength) {
    throw new MatterWorkUpdateError("INVALID_INPUT", "Vrijednost polja je predugačka.");
  }
  return normalized;
}

function requireOption(value: string, options: readonly string[]) {
  if (value !== "" && !options.includes(value)) {
    throw new MatterWorkUpdateError("INVALID_INPUT", "Izabrana vrijednost nije dozvoljena.");
  }
  return value;
}

export function validateMatterWorkValues(input: unknown): MatterWorkValues {
  if (typeof input !== "object" || input === null || Array.isArray(input)) {
    throw new MatterWorkUpdateError("INVALID_INPUT", "Podaci za čuvanje nijesu validni.");
  }
  const record = input as Record<string, unknown>;
  if (
    Object.keys(record).length !== MATTER_WORK_FIELD_KEYS.length ||
    Object.keys(record).some((key) => !MATTER_WORK_FIELD_KEYS.includes(key as MatterWorkFieldKey))
  ) {
    throw new MatterWorkUpdateError("INVALID_INPUT", "Podaci sadrže nedozvoljena polja.");
  }

  const deadline = normalizeSingleLine(record.deadline, 10);
  if (deadline !== "" && !/^\d{4}-\d{2}-\d{2}$/.test(deadline)) {
    throw new MatterWorkUpdateError("INVALID_INPUT", "Rok nije validan datum.");
  }

  return {
    status: requireOption(normalizeSingleLine(record.status, 60), MATTER_WORK_STATUSES),
    priority: requireOption(normalizeSingleLine(record.priority, 30), MATTER_WORK_PRIORITIES),
    nextStep: normalizeSingleLine(record.nextStep, 500),
    waitingFor: requireOption(normalizeSingleLine(record.waitingFor, 60), MATTER_WORK_WAITING_OPTIONS),
    waitingDetail: normalizeSingleLine(record.waitingDetail, 500),
    deadline,
  };
}

function lineLabel(line: string) {
  const separatorIndex = line.indexOf(":");
  return separatorIndex >= 0 ? line.slice(0, separatorIndex) : "";
}

export function updateCommandCenterContent(content: string, values: MatterWorkValues) {
  const lines = content.split(/\r?\n/);
  const output: string[] = [];
  const updatedFields = new Set<MatterWorkFieldKey>();
  const hasWaitingDetail = lines.some(
    (line) => lineLabel(line) === LABEL_BY_WORK_FIELD.waitingDetail,
  );

  for (let index = 0; index < lines.length;) {
    const label = lineLabel(lines[index]);
    const field = MATTER_WORK_FIELD_KEYS.find((key) => LABEL_BY_WORK_FIELD[key] === label);
    if (!field) {
      output.push(lines[index]);
      index += 1;
      continue;
    }

    output.push(`${label}: ${values[field]}`.trimEnd());
    updatedFields.add(field);
    if (field === "waitingFor" && !hasWaitingDetail && values.waitingDetail) {
      output.push(`${LABEL_BY_WORK_FIELD.waitingDetail}: ${values.waitingDetail}`);
      updatedFields.add("waitingDetail");
    }
    index += 1;
    while (index < lines.length && !KNOWN_LABELS.has(lineLabel(lines[index]))) index += 1;
  }

  const requiredFields = MATTER_WORK_FIELD_KEYS.filter((field) => field !== "waitingDetail");
  if (requiredFields.some((field) => !updatedFields.has(field))) {
    throw new MatterWorkUpdateError(
      "INVALID_INPUT",
      "command-center.md nema sva potrebna operativna polja.",
    );
  }
  return output.join("\r\n");
}

export async function saveMatterWorkValues(commandCenterPath: string, input: unknown) {
  const values = validateMatterWorkValues(input);
  let fileInfo;
  try {
    fileInfo = await lstat(commandCenterPath);
    if (!fileInfo.isFile() || fileInfo.isSymbolicLink()) throw new Error("UNSAFE");
    if (fileInfo.size > MAX_COMMAND_CENTER_BYTES) {
      throw new MatterWorkUpdateError("FILE_TOO_LARGE", "Kontrolni fajl je prevelik za bezbjednu izmjenu.");
    }
    const [realFile, realParent] = await Promise.all([
      realpath(commandCenterPath),
      realpath(path.win32.dirname(commandCenterPath)),
    ]);
    if (path.win32.dirname(realFile).toLocaleLowerCase("en-US") !== realParent.toLocaleLowerCase("en-US")) {
      throw new Error("UNSAFE");
    }
  } catch (error) {
    if (error instanceof MatterWorkUpdateError) throw error;
    throw new MatterWorkUpdateError("UNSAFE_FILE", "Kontrolni fajl nije bezbjedno dostupan.", { cause: error });
  }

  const currentContent = await readFile(commandCenterPath, "utf8");
  const updatedContent = updateCommandCenterContent(currentContent, values);
  const temporaryPath = path.win32.join(
    path.win32.dirname(commandCenterPath),
    `.command-center.${randomUUID()}.tmp`,
  );
  try {
    await writeFile(temporaryPath, updatedContent, { encoding: "utf8", flag: "wx" });
    await rename(temporaryPath, commandCenterPath);
  } catch (error) {
    await rm(temporaryPath, { force: true }).catch(() => undefined);
    throw new MatterWorkUpdateError("WRITE_FAILED", "Operativni podaci nijesu sačuvani.", { cause: error });
  }
  return values;
}
