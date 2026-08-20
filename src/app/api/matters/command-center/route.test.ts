import { beforeEach, describe, expect, it, vi } from "vitest";

const mutationMocks = vi.hoisted(() => ({
  readCanonicalMatterState: vi.fn(),
  acceptCanonicalMatterBaseline: vi.fn(),
  mutateCanonicalMatter: vi.fn(),
}));

const matterMocks = vi.hoisted(() => ({
  resolveSafeMatterForMutation: vi.fn(),
}));

vi.mock("../../../../lib/sdj-canonical-mutation", () => mutationMocks);
vi.mock("../../../../lib/sdj-matters", () => {
  class MatterResolutionError extends Error {
    constructor(readonly code: string, message: string) {
      super(message);
    }
  }
  return { ...matterMocks, MatterResolutionError };
});

import {
  GET,
  PATCH,
  POST,
  parseBaselineRequest,
  parseMutationRequest,
} from "./route";

const TOKEN = `sha256:${"a".repeat(64)}`;
const NEXT_TOKEN = `sha256:${"b".repeat(64)}`;
const matter = { clientFolder: "TEST", matterFolder: "SDJ_TEST" };

function jsonRequest(method: "POST" | "PATCH", body: unknown) {
  return new Request("http://localhost/api/matters/command-center", {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("WRITE-PROD-1A command-center route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    matterMocks.resolveSafeMatterForMutation.mockResolvedValue(matter);
  });

  it("reads the uncached exact-token and baseline state", async () => {
    mutationMocks.readCanonicalMatterState.mockResolvedValue({
      readToken: TOKEN,
      baselineState: "BASELINE_REQUIRED",
      values: { matterType: "Ugovorni predmet", nextStep: "Pregled" },
    });

    const response = await GET(new Request(
      "http://localhost/api/matters/command-center?clientFolder=TEST&matterFolder=SDJ_TEST",
    ));

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      readToken: TOKEN,
      baselineState: "BASELINE_REQUIRED",
    });
  });

  it("requires an exact-token baseline request and rejects legacy blind POST bodies", async () => {
    expect(parseBaselineRequest({ clientFolder: "TEST", matterFolder: "SDJ_TEST", values: {} })).toBeNull();

    const response = await POST(jsonRequest("POST", {
      clientFolder: "TEST",
      matterFolder: "SDJ_TEST",
      values: { nextStep: "Blind write" },
    }));

    expect(response.status).toBe(400);
    expect(mutationMocks.acceptCanonicalMatterBaseline).not.toHaveBeenCalled();
  });

  it("accepts a reviewed baseline and returns its accepted revision", async () => {
    mutationMocks.acceptCanonicalMatterBaseline.mockResolvedValue({
      code: "BASELINE_ACCEPTED",
      transactionId: "tx-1",
      revisionId: "revision-1",
      readToken: TOKEN,
    });

    const response = await POST(jsonRequest("POST", {
      clientFolder: "TEST",
      matterFolder: "SDJ_TEST",
      expectedReadToken: TOKEN,
    }));

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      code: "BASELINE_ACCEPTED",
      baselineState: "CURRENT",
      acceptedRevisionId: "revision-1",
    });
  });

  it("maps stale baseline acceptance to stable 409 CONFLICT", async () => {
    mutationMocks.acceptCanonicalMatterBaseline.mockResolvedValue({
      code: "CONFLICT",
      transactionId: "tx-1",
      observedReadToken: NEXT_TOKEN,
      detail: "mismatch",
    });

    const response = await POST(jsonRequest("POST", {
      clientFolder: "TEST",
      matterFolder: "SDJ_TEST",
      expectedReadToken: TOKEN,
    }));

    expect(response.status).toBe(409);
    expect(await response.json()).toMatchObject({ code: "CONFLICT" });
  });

  it("requires field, exact token and accepted revision for mutation", () => {
    expect(parseMutationRequest({
      clientFolder: "TEST",
      matterFolder: "SDJ_TEST",
      field: "nextStep",
      value: "Review",
      expectedReadToken: TOKEN,
      acceptedRevisionId: "revision-1",
    })).toMatchObject({ field: "nextStep" });
    expect(parseMutationRequest({
      clientFolder: "TEST",
      matterFolder: "SDJ_TEST",
      field: "nextStep",
      value: "Review",
      acceptedRevisionId: "revision-1",
    })).toBeNull();
    expect(parseMutationRequest({
      clientFolder: "TEST",
      matterFolder: "SDJ_TEST",
      field: "status",
      value: "Aktivan",
      expectedReadToken: TOKEN,
      acceptedRevisionId: "revision-1",
    })).toBeNull();
  });

  it("routes one allowed field through the accepted mutation adapter", async () => {
    mutationMocks.mutateCanonicalMatter.mockResolvedValue({
      code: "CANONICAL_SUCCESS",
      transactionId: "tx-2",
      resultingReadToken: NEXT_TOKEN,
      currentRevisionId: "revision-2",
    });
    const body = {
      clientFolder: "TEST",
      matterFolder: "SDJ_TEST",
      field: "matterType",
      value: "Privredni spor",
      expectedReadToken: TOKEN,
      acceptedRevisionId: "revision-1",
    };

    const response = await PATCH(jsonRequest("PATCH", body));

    expect(response.status).toBe(200);
    expect(mutationMocks.mutateCanonicalMatter).toHaveBeenCalledWith(matter, body);
    expect(await response.json()).toMatchObject({
      code: "CANONICAL_SUCCESS",
      readToken: NEXT_TOKEN,
      acceptedRevisionId: "revision-2",
    });
  });

  it.each([
    ["CONFLICT", 409],
    ["EXTERNAL_BASELINE_REVIEW_REQUIRED", 409],
    ["VALIDATION_FAILED", 422],
    ["IO_FAILED", 500],
    ["RECOVERY_REQUIRED", 503],
  ] as const)("maps %s to HTTP %i", async (code, status) => {
    mutationMocks.mutateCanonicalMatter.mockResolvedValue({
      code,
      transactionId: "tx-failed",
    });

    const response = await PATCH(jsonRequest("PATCH", {
      clientFolder: "TEST",
      matterFolder: "SDJ_TEST",
      field: "nextStep",
      value: "Review",
      expectedReadToken: TOKEN,
      acceptedRevisionId: "revision-1",
    }));

    expect(response.status).toBe(status);
    expect(await response.json()).toMatchObject({ code });
  });

  it("rejects extra query and mutation fields fail-closed", async () => {
    const getResponse = await GET(new Request(
      "http://localhost/api/matters/command-center?clientFolder=TEST&matterFolder=SDJ_TEST&extra=true",
    ));
    const patchResponse = await PATCH(jsonRequest("PATCH", {
      clientFolder: "TEST",
      matterFolder: "SDJ_TEST",
      field: "nextStep",
      value: "Review",
      expectedReadToken: TOKEN,
      acceptedRevisionId: "revision-1",
      priority: "Hitno",
    }));

    expect(getResponse.status).toBe(400);
    expect(patchResponse.status).toBe(400);
    expect(mutationMocks.mutateCanonicalMatter).not.toHaveBeenCalled();
  });
});
