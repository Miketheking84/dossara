import path from "node:path";
import { NextResponse } from "next/server";
import {
  MatterWorkUpdateError,
  saveMatterWorkValues,
} from "@/lib/sdj-command-center-update";
import {
  MatterResolutionError,
  resolveSafeMatterForMutation,
} from "@/lib/sdj-matters";

export const runtime = "nodejs";

type UpdateRequest = {
  clientFolder: string;
  matterFolder: string;
  values: unknown;
};

function readRequestBody(body: unknown): UpdateRequest | null {
  if (typeof body !== "object" || body === null || Array.isArray(body)) return null;
  const record = body as Record<string, unknown>;
  const allowedKeys = new Set(["clientFolder", "matterFolder", "values"]);
  if (Object.keys(record).some((key) => !allowedKeys.has(key))) return null;
  if (
    typeof record.clientFolder !== "string" ||
    typeof record.matterFolder !== "string" ||
    !("values" in record)
  ) {
    return null;
  }
  return {
    clientFolder: record.clientFolder,
    matterFolder: record.matterFolder,
    values: record.values,
  };
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Zahtjev nije validan." }, { status: 400 });
  }
  const input = readRequestBody(body);
  if (!input) {
    return NextResponse.json({ error: "Zahtjev nije validan." }, { status: 400 });
  }

  try {
    const matter = await resolveSafeMatterForMutation(
      input.clientFolder,
      input.matterFolder,
    );
    const commandCenterPath = path.win32.join(
      matter.controlPath,
      "command-center.md",
    );
    const values = await saveMatterWorkValues(commandCenterPath, input.values);
    return NextResponse.json({ ok: true, values });
  } catch (error) {
    if (error instanceof MatterResolutionError) {
      const notFound = error.code === "CLIENT_NOT_FOUND" || error.code === "MATTER_NOT_FOUND";
      return NextResponse.json(
        { error: "Izabrani predmet nije bezbjedno dostupan." },
        { status: notFound ? 404 : 400 },
      );
    }
    if (error instanceof MatterWorkUpdateError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.code === "INVALID_INPUT" ? 400 : 500 },
      );
    }
    return NextResponse.json(
      { error: "Operativni podaci trenutno nijesu sačuvani." },
      { status: 500 },
    );
  }
}
