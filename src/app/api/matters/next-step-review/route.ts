import { NextResponse } from "next/server";
import { resolveSafeMatterForMutation, MatterResolutionError } from "@/lib/sdj-matters";
import { AlphaReviewError, createNextStepProposal, readAlphaState, registerAlphaEvidence, reviewNextStep, type ReviewInput } from "@/lib/sdj-next-step-review";

export const runtime = "nodejs";
function localRequest(request: Request) {
  const url = new URL(request.url);
  const origin = request.headers.get("origin");
  // Next production may normalize request.url to localhost; the browser uses Host.
  let browserUrl: URL;
  try { browserUrl = new URL(`${url.protocol}//${request.headers.get("host") ?? url.host}`); }
  catch { return false; }
  const loopback = ["127.0.0.1", "localhost", "[::1]"];
  return loopback.includes(url.hostname) && loopback.includes(browserUrl.hostname) &&
    browserUrl.port === url.port && (!origin || origin === browserUrl.origin) &&
    !["cross-site", "same-site"].includes(request.headers.get("sec-fetch-site") ?? "");
}
function errorResponse(error: unknown) {
  if (error instanceof AlphaReviewError) return NextResponse.json({ code: error.code, error: error.message }, { status: error.code === "INVALID_INPUT" ? 400 : 409 });
  if (error instanceof MatterResolutionError) return NextResponse.json({ code: "INVALID_MATTER", error: "Matter is not safely available" }, { status: 400 });
  return NextResponse.json({ code: "RECOVERY_REQUIRED", error: "Operation could not be verified. Reload before recovery." }, { status: 503 });
}
function exact(input: Record<string, unknown>, keys: string[]) {
  if (Object.keys(input).length !== keys.length || keys.some((key) => !Object.hasOwn(input, key)) ||
      Object.values(input).some((value) => typeof value !== "string")) throw new AlphaReviewError("INVALID_INPUT", "Invalid request fields");
}
export async function GET(request: Request) {
  if (!localRequest(request)) return NextResponse.json({ error: "Untrusted origin" }, { status: 403 });
  try {
    const query = new URL(request.url).searchParams;
    if (query.size !== 2 || !query.get("clientFolder") || !query.get("matterFolder")) throw new AlphaReviewError("INVALID_INPUT", "Invalid matter query");
    const matter = await resolveSafeMatterForMutation(query.get("clientFolder")!, query.get("matterFolder")!);
    return NextResponse.json(await readAlphaState(matter), { headers: { "Cache-Control": "no-store" } });
  } catch (error) { return errorResponse(error); }
}
export async function POST(request: Request) {
  if (!localRequest(request)) return NextResponse.json({ error: "Untrusted origin" }, { status: 403 });
  try {
    if (request.headers.get("content-type")?.startsWith("multipart/form-data")) {
      const form = await request.formData();
      const keys = [...form.keys()];
      if (keys.length !== 3 || !["clientFolder", "matterFolder", "evidence"].every((key) => keys.includes(key))) throw new AlphaReviewError("INVALID_INPUT", "Exactly one evidence file is required");
      const file = form.get("evidence");
      if (!(file instanceof File) || typeof form.get("clientFolder") !== "string" || typeof form.get("matterFolder") !== "string") throw new AlphaReviewError("INVALID_INPUT", "Invalid evidence input");
      const matter = await resolveSafeMatterForMutation(String(form.get("clientFolder")), String(form.get("matterFolder")));
      return NextResponse.json(await registerAlphaEvidence(matter, file), { status: 201 });
    }
    const body = await request.json();
    if (!body || typeof body !== "object" || Array.isArray(body)) throw new AlphaReviewError("INVALID_INPUT", "Invalid JSON request");
    if (body.action === "propose") {
      exact(body, ["action", "clientFolder", "matterFolder", "evidenceId", "nextStep", "originalResult", "baseToken", "baseRevision"]);
      const matter = await resolveSafeMatterForMutation(body.clientFolder, body.matterFolder);
      return NextResponse.json(await createNextStepProposal(matter, body), { status: 201 });
    }
    if (body.action === "review" || body.action === "recover") {
      exact(body, ["action", "clientFolder", "matterFolder", "reviewId", "proposalId", "decision", "value", "lawyerId", "lawyerName", "baseToken", "baseRevision"]);
      const matter = await resolveSafeMatterForMutation(body.clientFolder, body.matterFolder);
      const input: ReviewInput = { reviewId: body.reviewId, proposalId: body.proposalId, decision: body.decision, value: body.value,
        lawyerId: body.lawyerId, lawyerName: body.lawyerName, baseToken: body.baseToken, baseRevision: body.baseRevision };
      const result = await reviewNextStep(matter, input, { recover: body.action === "recover" });
      const ok = ["REJECTED", "CANONICAL_SUCCESS", "CANONICAL_SUCCESS_DERIVED_REBUILD_REQUIRED"].includes(result.code);
      return NextResponse.json(result, { status: ok ? 200 : 409 });
    }
    throw new AlphaReviewError("INVALID_INPUT", "Unsupported Alpha action");
  } catch (error) { return errorResponse(error); }
}
