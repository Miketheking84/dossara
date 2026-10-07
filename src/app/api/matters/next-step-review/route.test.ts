import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, it, expect, beforeEach, vi } from "vitest";
const mocks = vi.hoisted(() => ({ resolve: vi.fn(), register: vi.fn(), propose: vi.fn(), review: vi.fn(), read: vi.fn() }));
vi.mock("@/lib/sdj-matters", () => ({ resolveSafeMatterForMutation: mocks.resolve, MatterResolutionError: class extends Error {} }));
vi.mock("@/lib/sdj-next-step-review", () => ({ AlphaReviewError: class extends Error { constructor(readonly code: string, message: string) { super(message); } },
  registerAlphaEvidence: mocks.register, createNextStepProposal: mocks.propose, reviewNextStep: mocks.review, readAlphaState: mocks.read }));
import { GET, POST } from "./route";
const url = "http://127.0.0.1/api/matters/next-step-review";
function request(body: unknown) { return new Request(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }); }
beforeEach(() => { vi.clearAllMocks(); mocks.resolve.mockResolvedValue({ matterFolder: "SDJ_ALPHA" }); });
describe("Alpha route input and trust boundary", () => {
  it("rejects foreign origins and non-loopback hosts before touching storage", async () => {
    const foreign = new Request(url, { method: "POST", headers: { origin: "https://foreign.test" }, body: "{}" });
    expect((await POST(foreign)).status).toBe(403);
    expect((await GET(new Request("http://192.0.2.1/api/matters/next-step-review?clientFolder=TEST&matterFolder=SDJ_ALPHA"))).status).toBe(403);
    expect(mocks.resolve).not.toHaveBeenCalled();
  });
  it("accepts browser loopback Host when Next normalizes the internal URL, but rejects foreign Host", async () => {
    mocks.read.mockResolvedValue({ proposals: [], lockPresent: false });
    const normalized = "http://localhost:3100/api/matters/next-step-review?clientFolder=TEST&matterFolder=SDJ_ALPHA";
    expect((await GET(new Request(normalized, { headers: { host: "127.0.0.1:3100", origin: "http://127.0.0.1:3100", "sec-fetch-site": "same-origin" } }))).status).toBe(200);
    expect((await GET(new Request(normalized, { headers: { host: "foreign.test:3100" } }))).status).toBe(403);
    expect((await GET(new Request(normalized, { headers: { host: "127.0.0.1:3200" } }))).status).toBe(403);
  });
  it("rejects unknown fields and unsupported actions", async () => {
    expect((await POST(request({ action: "applyAnything" }))).status).toBe(400);
    expect((await POST(request({ action: "propose", clientFolder: "TEST", matterFolder: "SDJ_ALPHA", evidenceId: "x", nextStep: "x", originalResult: "x", baseToken: "x", baseRevision: "x", arbitraryPath: "x" }))).status).toBe(400);
    expect(mocks.propose).not.toHaveBeenCalled();
  });
  it("passes exactly one evidence file and target matter", async () => {
    const form = new FormData(); form.set("clientFolder", "TEST"); form.set("matterFolder", "SDJ_ALPHA"); form.set("evidence", new File(["evidence"], "source.txt"));
    mocks.register.mockResolvedValue({ evidenceId: "evidence-id" });
    const response = await POST(new Request(url, { method: "POST", body: form }));
    expect(response.status).toBe(201); expect(mocks.register).toHaveBeenCalledTimes(1);
    form.append("evidence", new File(["second"], "second.txt"));
    expect((await POST(new Request(url, { method: "POST", body: form }))).status).toBe(400);
  });
  it("recovery reuses the exact review payload, never creating a fresh operation", async () => {
    const body = { action: "recover", clientFolder: "TEST", matterFolder: "SDJ_ALPHA", reviewId: "review", proposalId: "proposal", decision: "modify", value: "lawyer value", lawyerId: "L1", lawyerName: "Lawyer", baseToken: "token", baseRevision: "revision" };
    mocks.review.mockResolvedValue({ code: "CANONICAL_SUCCESS", transactionId: "existing" });
    expect((await POST(request(body))).status).toBe(200);
    expect(mocks.review.mock.calls[0][1]).toEqual({ reviewId: "review", proposalId: "proposal", decision: "modify", value: "lawyer value", lawyerId: "L1", lawyerName: "Lawyer", baseToken: "token", baseRevision: "revision" });
    expect(mocks.review.mock.calls[0][2]).toEqual({ recover: true });
  });
  it("reads uncached persisted workflow and rejects extra query fields", async () => {
    mocks.read.mockResolvedValue({ proposals: [], lockPresent: false });
    const response = await GET(new Request(`${url}?clientFolder=TEST&matterFolder=SDJ_ALPHA`));
    expect(response.status).toBe(200); expect(response.headers.get("cache-control")).toBe("no-store");
    expect((await GET(new Request(`${url}?clientFolder=TEST&matterFolder=SDJ_ALPHA&extra=1`))).status).toBe(400);
  });
});

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));
vi.mock("next-intl", () => ({ useTranslations: () => (key: string) => key }));
it("renders the bounded panel without exposing controls for unrelated legal state", async () => {
  const { NextStepReviewPanel } = await import("../../../matters/[clientFolder]/[matterFolder]/next-step-review-panel");
  const html = renderToStaticMarkup(createElement(NextStepReviewPanel, { clientFolder: "TEST", matterFolder: "SDJ_ALPHA" }));
  expect(html).toContain('type="file"'); expect(html).toContain('type="button"'); expect(html).toContain("original");
  expect(html).toContain("lawyerId"); expect(html).not.toContain('type="date"');
});
