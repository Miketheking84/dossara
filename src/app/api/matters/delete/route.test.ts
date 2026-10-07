import { beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ resolve: vi.fn(), directory: vi.fn(), rename: vi.fn(), stat: vi.fn(), gate: vi.fn() }));
vi.mock("@/lib/sdj-files", () => import("../../../../lib/sdj-files"));
vi.mock("node:fs/promises", () => ({ rename: mocks.rename, stat: mocks.stat }));
vi.mock("@/lib/sdj-matters", () => ({ resolveSafeMatterForMutation: mocks.resolve, ensureSafeDirectoryForMutation: mocks.directory, MatterResolutionError: class extends Error {} }));
vi.mock("@/lib/sdj-next-step-review", () => ({ AlphaReviewError: class extends Error { constructor(readonly code: string, message: string) { super(message); } }, withAlphaMatterGate: mocks.gate }));
import { AlphaReviewError } from "@/lib/sdj-next-step-review";
import { POST } from "./route";
const root = "C:\\SDJ_TEST\\SDJ_LEGAL_TEST";
function request(clientFolder = "TEST", matterFolder = "SDJ_ALPHA") { return new Request("http://127.0.0.1/api/matters/delete", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ clientFolder, matterFolder }) }); }
beforeEach(() => {
  vi.clearAllMocks(); mocks.resolve.mockResolvedValue({ workspaceRoot: root, matterPath: `${root}\\01 KLIJENTI\\TEST\\SDJ_ALPHA` });
  mocks.directory.mockImplementation(async (parent, name) => `${parent}\\${name}`);
  mocks.stat.mockRejectedValue(Object.assign(new Error("missing"), { code: "ENOENT" }));
  mocks.rename.mockResolvedValue(undefined); mocks.gate.mockImplementation(async (_matter, action) => action());
});
describe("archive preserves behavior but honors pending Alpha apply", () => {
  it("blocks before moving any folder when recovery is pending", async () => {
    mocks.gate.mockRejectedValueOnce(new AlphaReviewError("RECOVERY_REQUIRED", "pending Alpha apply"));
    const response = await POST(request()); expect(response.status).toBe(409); expect(mocks.rename).not.toHaveBeenCalled();
    expect(mocks.directory).not.toHaveBeenCalled();
  });
  it("retains existing archive behavior and tells the gate where its lock moved", async () => {
    const response = await POST(request()); expect(response.status).toBe(200); expect(mocks.rename).toHaveBeenCalledTimes(1);
    const destination = mocks.rename.mock.calls[0][1];
    expect(mocks.gate.mock.calls[0][2].movedMatterPath()).toBe(destination);
  });
  it("rejects traversal without reaching the writer gate", async () => {
    expect((await POST(request("../OTHER"))).status).toBe(400); expect(mocks.gate).not.toHaveBeenCalled();
  });
});
