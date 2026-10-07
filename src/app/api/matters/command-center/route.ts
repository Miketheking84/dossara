import { AlphaReviewError, withAlphaMatterGate } from "@/lib/sdj-next-step-review";
import { NextResponse } from "next/server";
import type { MutableMatterField } from "../../../../../spikes/write-1v-v1-mutation/contracts";
import {
  acceptExternalCanonicalMatterBaseline,
  acceptCanonicalMatterBaseline,
  mutateCanonicalMatter,
  readCanonicalMatterState,
} from "../../../../lib/sdj-canonical-mutation";
import { isMatterType } from "../../../../lib/sdj-matter-classification";
import {
  MatterResolutionError,
  resolveSafeMatterForMutation,
  type ResolvedActiveMatter,
} from "../../../../lib/sdj-matters";

export const runtime = "nodejs";

const READ_TOKEN_PATTERN = /^sha256:[0-9a-f]{64}$/u;

type BaselineRequest = {
  clientFolder: string;
  matterFolder: string;
  expectedReadToken: string;
};

type MutationRequest = BaselineRequest & {
  acceptedRevisionId: string;
  field: MutableMatterField;
  value: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function hasExactKeys(record: Record<string, unknown>, keys: readonly string[]) {
  const actual = Object.keys(record).sort();
  const expected = [...keys].sort();
  return actual.length === expected.length && actual.every((key, index) => key === expected[index]);
}

export function parseBaselineRequest(body: unknown): BaselineRequest | null {
  if (!isRecord(body) || !hasExactKeys(body, ["clientFolder", "matterFolder", "expectedReadToken"])) {
    return null;
  }
  if (
    typeof body.clientFolder !== "string" ||
    typeof body.matterFolder !== "string" ||
    typeof body.expectedReadToken !== "string" ||
    !READ_TOKEN_PATTERN.test(body.expectedReadToken)
  ) {
    return null;
  }
  return {
    clientFolder: body.clientFolder,
    matterFolder: body.matterFolder,
    expectedReadToken: body.expectedReadToken,
  };
}

export function parseMutationRequest(body: unknown): MutationRequest | null {
  if (
    !isRecord(body) ||
    !hasExactKeys(body, [
      "clientFolder",
      "matterFolder",
      "expectedReadToken",
      "acceptedRevisionId",
      "field",
      "value",
    ])
  ) {
    return null;
  }
  if (
    typeof body.clientFolder !== "string" ||
    typeof body.matterFolder !== "string" ||
    typeof body.expectedReadToken !== "string" ||
    !READ_TOKEN_PATTERN.test(body.expectedReadToken) ||
    typeof body.acceptedRevisionId !== "string" ||
    body.acceptedRevisionId.length === 0 ||
    body.acceptedRevisionId.length > 200 ||
    (body.field !== "matterType" && body.field !== "nextStep") ||
    typeof body.value !== "string" ||
    body.value.length === 0 ||
    body.value.length > 500 ||
    /[\r\n]/u.test(body.value) ||
    (body.field === "matterType" && !isMatterType(body.value))
  ) {
    return null;
  }
  return body as MutationRequest;
}

function invalidRequest() {
  return NextResponse.json(
    { code: "INVALID_REQUEST", error: "Zahtjev nije validan." },
    { status: 400 },
  );
}

function resolutionFailure(error: MatterResolutionError) {
  const notFound = error.code === "CLIENT_NOT_FOUND" || error.code === "MATTER_NOT_FOUND";
  return NextResponse.json(
    { code: error.code, error: "Izabrani predmet nije bezbjedno dostupan." },
    { status: notFound ? 404 : 400 },
  );
}

async function resolveMatter(clientFolder: string, matterFolder: string) {
  return resolveSafeMatterForMutation(clientFolder, matterFolder);
}

async function jsonBody(request: Request): Promise<unknown | undefined> {
  try {
    return await request.json();
  } catch {
    return undefined;
  }
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const clientFolder = url.searchParams.get("clientFolder");
  const matterFolder = url.searchParams.get("matterFolder");
  if (!clientFolder || !matterFolder || url.searchParams.size !== 2) return invalidRequest();

  try {
    const matter = await resolveMatter(clientFolder, matterFolder);
    return NextResponse.json(await readCanonicalMatterState(matter));
  } catch (error) {
    if (error instanceof AlphaReviewError) return NextResponse.json({ code: error.code, error: error.message }, { status: 409 });
    if (error instanceof MatterResolutionError) return resolutionFailure(error);
    return NextResponse.json(
      { code: "IO_FAILED", error: "Canonical podatke trenutno nije moguće pročitati." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  const input = parseBaselineRequest(await jsonBody(request));
  if (!input) return invalidRequest();

  try {
    const matter = await resolveMatter(input.clientFolder, input.matterFolder);
    const result = await withAlphaMatterGate(matter, () => acceptCanonicalMatterBaseline(matter, input.expectedReadToken));
    if (result.code === "BASELINE_ACCEPTED" || result.code === "BASELINE_ALREADY_ACCEPTED") {
      return NextResponse.json({
        ...result,
        baselineState: "CURRENT",
        acceptedRevisionId: result.revisionId,
      });
    }
    return NextResponse.json(
      {
        ...result,
        baselineState: result.code === "CONFLICT"
          ? "BASELINE_REQUIRED"
          : "EXTERNAL_BASELINE_REVIEW_REQUIRED",
        error: result.code === "CONFLICT"
          ? "Fajl je promijenjen nakon pregleda. Učitajte ga ponovo prije prihvatanja."
          : "Postojeća accepted verzija se razlikuje. Potreban je novi eksplicitni review.",
      },
      { status: 409 },
    );
  } catch (error) {
    if (error instanceof AlphaReviewError) return NextResponse.json({ code: error.code, error: error.message }, { status: 409 });
    if (error instanceof MatterResolutionError) return resolutionFailure(error);
    return NextResponse.json(
      { code: "IO_FAILED", error: "Baseline trenutno nije moguće prihvatiti." },
      { status: 500 },
    );
  }
}

export async function PUT(request: Request) {
  const input = parseBaselineRequest(await jsonBody(request));
  if (!input) return invalidRequest();

  try {
    const matter = await resolveMatter(input.clientFolder, input.matterFolder);
    const result = await withAlphaMatterGate(matter, () => acceptExternalCanonicalMatterBaseline(matter, input.expectedReadToken));
    if (
      result.code === "EXTERNAL_BASELINE_ACCEPTED" ||
      result.code === "BASELINE_ALREADY_ACCEPTED"
    ) {
      return NextResponse.json({
        ...result,
        baselineState: "CURRENT",
        acceptedRevisionId: result.revisionId,
      });
    }
    return NextResponse.json(
      {
        ...result,
        baselineState: result.code === "CONFLICT"
          ? "EXTERNAL_BASELINE_REVIEW_REQUIRED"
          : "BASELINE_REQUIRED",
        error: result.code === "CONFLICT"
          ? "Fajl je promijenjen nakon pregleda. Učitajte ga ponovo prije prihvatanja."
          : "Eksterna baseline revizija zahtijeva prethodnu accepted reviziju.",
      },
      { status: 409 },
    );
  } catch (error) {
    if (error instanceof AlphaReviewError) return NextResponse.json({ code: error.code, error: error.message }, { status: 409 });
    if (error instanceof MatterResolutionError) return resolutionFailure(error);
    return NextResponse.json(
      { code: "IO_FAILED", error: "Eksternu baseline reviziju trenutno nije moguće prihvatiti." },
      { status: 500 },
    );
  }
}

function mutationFailure(result: Awaited<ReturnType<typeof mutateCanonicalMatter>>) {
  const status = result.code === "CONFLICT" || result.code === "EXTERNAL_BASELINE_REVIEW_REQUIRED"
    ? 409
    : result.code === "VALIDATION_FAILED"
      ? 422
      : result.code === "RECOVERY_REQUIRED"
        ? 503
        : 500;
  const error = result.code === "CONFLICT"
    ? "Fajl je promijenjen. Pregledajte novu verziju prije ponovnog pokušaja."
    : result.code === "EXTERNAL_BASELINE_REVIEW_REQUIRED"
      ? "Canonical verzija nema odgovarajući accepted baseline."
      : result.code === "VALIDATION_FAILED"
        ? "Tražena izmjena nije dozvoljena."
        : result.code === "RECOVERY_REQUIRED"
          ? "Ishod čuvanja zahtijeva recovery provjeru."
          : "Izmjenu trenutno nije moguće bezbjedno sačuvati.";
  return NextResponse.json({ ...result, error }, { status });
}

export async function PATCH(request: Request) {
  const input = parseMutationRequest(await jsonBody(request));
  if (!input) return invalidRequest();

  try {
    const matter: ResolvedActiveMatter = await resolveMatter(
      input.clientFolder,
      input.matterFolder,
    );
    const result = await withAlphaMatterGate(matter, () => mutateCanonicalMatter(matter, input));
    if (
      result.code !== "CANONICAL_SUCCESS" &&
      result.code !== "CANONICAL_SUCCESS_DERIVED_REBUILD_REQUIRED"
    ) {
      return mutationFailure(result);
    }
    return NextResponse.json(
      {
        ...result,
        acceptedRevisionId: result.currentRevisionId,
        readToken: result.resultingReadToken,
        value: input.value,
      },
      { status: result.code === "CANONICAL_SUCCESS" ? 200 : 202 },
    );
  } catch (error) {
    if (error instanceof AlphaReviewError) return NextResponse.json({ code: error.code, error: error.message }, { status: 409 });
    if (error instanceof MatterResolutionError) return resolutionFailure(error);
    return NextResponse.json(
      { code: "IO_FAILED", error: "Izmjenu trenutno nije moguće bezbjedno sačuvati." },
      { status: 500 },
    );
  }
}
