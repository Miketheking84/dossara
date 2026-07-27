import { validateInitialDocuments } from "../../../lib/sdj-initial-documents";

export type MatterInput = {
  client: string;
  matterName: string;
  legalArea: string;
  status: string;
  priority: string;
  description: string;
  nextStep: string;
  deadline: string;
  waitingFrom: string;
  waitingDetail: string;
  expectedOutput: string;
  openingDate: string;
  folderNameOverride: string;
};

export type MatterRequestParseResult =
  | {
      ok: true;
      input: MatterInput | null;
      format: "json" | "multipart";
      initialDocumentCount: number;
    }
  | { ok: false; error: string; status: 400 | 415 };

const MATTER_INPUT_FIELDS = [
  "client",
  "matterName",
  "legalArea",
  "status",
  "priority",
  "description",
  "nextStep",
  "deadline",
  "waitingFrom",
  "waitingDetail",
  "expectedOutput",
  "openingDate",
  "folderNameOverride",
] as const satisfies readonly (keyof MatterInput)[];
const MATTER_INPUT_FIELD_SET = new Set<string>(MATTER_INPUT_FIELDS);
const INITIAL_DOCUMENT_FIELD = "initialDocuments";
const INITIAL_DOCUMENT_VALIDATION_MESSAGE =
  "Početna dokumentacija nije prihvaćena. Provjerite tip, naziv, broj i veličinu fajlova.";

function readInput(body: unknown): MatterInput | null {
  if (typeof body !== "object" || body === null) return null;
  const value = body as Record<string, unknown>;
  const get = (key: keyof MatterInput) =>
    typeof value[key] === "string" ? value[key].trim() : "";
  return {
    client: get("client"),
    matterName: get("matterName"),
    legalArea: get("legalArea") || "Opšte",
    status: get("status") || "Aktivan",
    priority: get("priority") || "Srednji",
    description: get("description"),
    nextStep: get("nextStep"),
    deadline: get("deadline"),
    waitingFrom: get("waitingFrom") || "Niko / nije primenljivo",
    waitingDetail: get("waitingDetail"),
    expectedOutput: get("expectedOutput"),
    openingDate: get("openingDate"),
    folderNameOverride: get("folderNameOverride"),
  };
}

export async function parseMatterRequest(
  request: Request,
): Promise<MatterRequestParseResult> {
  const contentType = request.headers
    .get("content-type")
    ?.split(";", 1)[0]
    .trim()
    .toLowerCase();

  if (contentType === "application/json") {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return { ok: false, error: "Neispravan JSON zahtev.", status: 400 };
    }
    const input = readInput(body);
    return { ok: true, input, format: "json", initialDocumentCount: 0 };
  }

  if (contentType !== "multipart/form-data") {
    return { ok: false, error: "Nepodržan tip zahtjeva.", status: 415 };
  }

  let formData: FormData;
  try {
    // request.formData() may materialize the body before metadata limits run.
    formData = await request.formData();
  } catch {
    return { ok: false, error: "Neispravan multipart zahtev.", status: 400 };
  }

  const initialDocuments: File[] = [];
  for (const [field, value] of formData.entries()) {
    if (field === INITIAL_DOCUMENT_FIELD) {
      if (!(value instanceof File)) {
        return {
          ok: false,
          error: "Početna dokumentacija mora sadržati fajlove.",
          status: 400,
        };
      }
      initialDocuments.push(value);
    } else if (value instanceof File) {
      return {
        ok: false,
        error: MATTER_INPUT_FIELD_SET.has(field)
          ? "Tekstualno polje ne može sadržati fajl."
          : "Multipart zahtev sadrži neočekivan fajl.",
        status: 400,
      };
    }
  }

  const body: Record<string, string> = {};
  for (const field of MATTER_INPUT_FIELDS) {
    const values = formData.getAll(field);
    if (values.length > 1) {
      return {
        ok: false,
        error: "Multipart zahtjev sadrži ponovljeno tekstualno polje.",
        status: 400,
      };
    }
    const value = values[0];
    if (value instanceof File) {
      return {
        ok: false,
        error: "Tekstualno polje ne može sadržati fajl.",
        status: 400,
      };
    }
    body[field] = value ?? "";
  }
  const input = readInput(body);
  if (!input) {
    return { ok: false, error: "Neispravan multipart zahtev.", status: 400 };
  }

  const validation = validateInitialDocuments(
    initialDocuments.map((file) => ({
      name: file.name,
      size: file.size,
      mimeType: file.type,
    })),
  );
  if (!validation.valid) {
    return {
      ok: false,
      error: INITIAL_DOCUMENT_VALIDATION_MESSAGE,
      status: 400,
    };
  }

  return {
    ok: true,
    input,
    format: "multipart",
    initialDocumentCount: initialDocuments.length,
  };
}
