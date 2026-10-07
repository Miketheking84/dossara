/* Local runtime acceptance only. No installed package or production workspace. */
/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const assert = require("node:assert/strict");
const { spawn, execFileSync } = require("node:child_process");
const http = require("node:http");
const repo = path.resolve(__dirname, "../..");
const root = "C:\\SDJ_TEST\\SDJ_LEGAL_TEST";
const origin = "http://127.0.0.1:3100";
const sha = (bytes) => "sha256:" + crypto.createHash("sha256").update(bytes).digest("hex");
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));
const bundled = path.join(process.env.USERPROFILE, ".cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright");
const { _electron } = require(process.env.DOSSARA_PLAYWRIGHT_PATH || bundled);
const electronPath = require("electron");
const evidenceDir = path.join(root, "stage-d-electron", new Date().toISOString().replace(/[:.]/g, "-"));
fs.mkdirSync(evidenceDir, { recursive: true });
const results = { environment: { repo, root, origin }, scenarios: [], errors: [] };
const artifacts = () => fs.writeFileSync(path.join(evidenceDir, "acceptance.json"), JSON.stringify(results, null, 2));
const settings = JSON.parse(fs.readFileSync(path.join(repo, ".sdj-mike/settings.json"), "utf8"));
for (const key of ["allowedTestRoot", "activeRootPath"]) assert.equal(path.resolve(settings[key]).toLowerCase(), path.resolve(root).toLowerCase());
const system = path.join(process.env.SystemRoot, "System32");
function snapshot(pid) {
  const code = `$p=Get-CimInstance Win32_Process -Filter 'ProcessId = ${Number(pid)}'; if($p){[pscustomobject]@{pid=$p.ProcessId; command=$p.CommandLine; executable=$p.ExecutablePath; created=$p.CreationDate.ToUniversalTime().ToString('o')}|ConvertTo-Json -Compress}`;
  const value = execFileSync(path.join(system, "WindowsPowerShell/v1.0/powershell.exe"), ["-NoProfile", "-NonInteractive", "-Command", code], { windowsHide: true, encoding: "utf8" }).trim();
  return value ? JSON.parse(value) : null;
}
function killVerified(saved) {
  const current = snapshot(saved.pid);
  assert.deepEqual(current, saved, "Refuse PID reuse or unrelated cleanup");
  execFileSync(path.join(system, "taskkill.exe"), ["/PID", String(saved.pid), "/T", "/F"], { windowsHide: true });
}
async function portFree() {
  const value = execFileSync(path.join(system, "netstat.exe"), ["-ano", "-p", "tcp"], { encoding: "utf8", windowsHide: true });
  return !value.split(/\r?\n/u).some(line => /\s[^\s]+:3100\s+[^\s]+\s+LISTENING\s+\d+/u.test(line));
}
async function waitFree() { for (let i = 0; i < 100; i++) { if (await portFree()) return; await delay(100); } throw new Error("Port remains occupied"); }
const launches = [];
let testOrphan;
let testForeign;
const testElectronChildren = [];
async function launch(alpha = true) {
  const env = { ...process.env, DOSSARA_ALPHA: alpha ? "1" : "0", DOSSARA_TEST_PROFILE: "1" };
  delete env.ELECTRON_RUN_AS_NODE;
  const app = await _electron.launch({ executablePath: electronPath, args: [repo], cwd: repo, env, timeout: 60000 });
  const item = { app, process: app.process(), logs: "", pid: app.process().pid };
  launches.push(item);
  app.process().stdout.on("data", bytes => { item.logs += bytes.toString(); });
  app.process().stderr.on("data", bytes => { item.logs += bytes.toString(); });
  // Capture native error dialog contents in automated failure cases; never provide
  // a legal decision or weaken the application request policy.
  await app.evaluate(({ dialog }) => { dialog.showMessageBox = async options => {
    console.error("ACCEPTANCE_RUNTIME_DIALOG", options.message); return { response: 0, checkboxChecked: false };
  }; });
  return item;
}
async function ready(item) {
  const page = await item.app.firstWindow({ timeout: 60000 });
  try { await page.getByRole("heading", { level: 1 }).waitFor({ timeout: 60000 }); }
  catch (error) {
    fs.writeFileSync(path.join(evidenceDir, "failed-page.txt"), await page.locator("body").innerText().catch(() => "Page unavailable"));
    await page.screenshot({ path: path.join(evidenceDir, "failed-page.png") }).catch(() => {});
    throw error;
  }
  assert.equal(page.url(), origin + "/matters");
  const match = item.logs.match(/DOSSARA_ALPHA_READY (\{[^\r\n]+\})/u);
  assert.ok(match, "Owned readiness event required");
  item.owner = snapshot(JSON.parse(match[1]).pid);
  assert.ok(item.owner && item.owner.command.includes(repo));
  return page;
}
async function capture(page, name) {
  fs.writeFileSync(path.join(evidenceDir, name + ".txt"), await page.locator("body").innerText());
  await page.bringToFront();
  await page.screenshot({ path: path.join(evidenceDir, name + ".png"), fullPage: false, timeout: 5000 }).catch(error => {
    (results.visualLimitations ||= []).push({ name, error: String(error) });
  });
}
async function close(item) { if (item.process.exitCode === null) await item.app.close(); await waitFree(); assert.ok(item.logs.includes("DOSSARA_ALPHA_STOPPED"), "Owned shutdown must finish before Electron exits"); }
async function lifecycle() {
  assert.ok(await portFree(), "Acceptance refuses preexisting listener");
  let item = await launch();
  const page = await ready(item);
  assert.deepEqual(await page.evaluate(() => ({ node: typeof window.require, process: typeof window.process, bridge: typeof window.sdj })), { node: "undefined", process: "undefined", bridge: "undefined" });
  results.scenarios.push({ scenario: "single owned server + sandbox", result: "PASS", electronPid: item.pid, next: item.owner });
  const secondEnvironment = { ...process.env, DOSSARA_ALPHA: "1", DOSSARA_TEST_PROFILE: "1" };
  delete secondEnvironment.ELECTRON_RUN_AS_NODE;
  const second = spawn(electronPath, [repo], { cwd: repo, env: secondEnvironment, stdio: ["ignore", "pipe", "pipe"], windowsHide: true });
  let secondLogs = "";
  second.stdout.on("data", bytes => { secondLogs += bytes.toString(); });
  second.stderr.on("data", bytes => { secondLogs += bytes.toString(); });
  const code = await new Promise((resolve, reject) => { second.once("error", reject); second.once("exit", resolve); });
  results.secondLaunch = { code, logs: secondLogs };
  assert.equal(code, 0); await delay(300); assert.deepEqual(snapshot(item.owner.pid), item.owner);
  assert.ok(item.logs.includes("DOSSARA_SECOND_INSTANCE"));
  assert.equal((item.logs.match(/DOSSARA_ALPHA_READY/g) || []).length, 1);
  results.scenarios.push({ scenario: "second launch", result: "PASS" });
  await capture(page, "electron-app");
  await close(item); results.scenarios.push({ scenario: "normal shutdown", result: "PASS", logs: item.logs });
  const foreign = http.createServer((_req, res) => res.end("unrelated listener")); testForeign = foreign;
  await new Promise((resolve, reject) => { foreign.once("error", reject); foreign.listen(3100, "127.0.0.1", resolve); });
  item = await launch(); await new Promise(resolve => item.process.once("exit", resolve));
  assert.ok(item.logs.includes("Port 3100 is occupied"));
  assert.equal(await (await fetch(origin)).text(), "unrelated listener");
  results.scenarios.push({ scenario: "occupied port refusal", result: "PASS", logs: item.logs });
  await new Promise(resolve => foreign.close(resolve));
  item = await launch(); await ready(item); killVerified(item.owner);
  await new Promise(resolve => item.process.once("exit", resolve)); await waitFree();
  assert.ok(item.logs.includes("Owned Next server exited"));
  results.scenarios.push({ scenario: "server crash", result: "PASS", logs: item.logs });
  item = await launch(); await ready(item); const orphan = item.owner; testOrphan = orphan; const parent = snapshot(item.pid);
  const childIds = JSON.parse(execFileSync(path.join(system, "WindowsPowerShell/v1.0/powershell.exe"), ["-NoProfile", "-NonInteractive", "-Command", `@(Get-CimInstance Win32_Process -Filter 'ParentProcessId = ${parent.pid}' | Where-Object { $_.Name -eq 'electron.exe' } | ForEach-Object { $_.ProcessId }) | ConvertTo-Json -Compress`], { encoding: "utf8", windowsHide: true }).trim() || "[]");
  for (const childPid of Array.isArray(childIds) ? childIds : [childIds]) { const child = snapshot(childPid); if (child && child.executable === electronPath) testElectronChildren.push(child); }
  // Kill the parent alone to reproduce the plain-spawn Windows orphan limitation.
  assert.deepEqual(snapshot(parent.pid), parent);
  execFileSync(path.join(system, "taskkill.exe"), ["/PID", String(parent.pid), "/F"], { windowsHide: true });
  await delay(500); assert.deepEqual(snapshot(orphan.pid), orphan);
  const refused = spawn(electronPath, [repo], { cwd: repo, env: secondEnvironment, stdio: ["ignore", "pipe", "pipe"], windowsHide: true });
  let refusalLogs = "";
  refused.stdout.on("data", bytes => { refusalLogs += bytes.toString(); });
  refused.stderr.on("data", bytes => { refusalLogs += bytes.toString(); });
  const refusalDeadline = Date.now() + 15000;
  while (refused.exitCode === null && !refusalLogs.includes("DOSSARA_ALPHA_FAILED") && Date.now() < refusalDeadline) await delay(100);
  assert.ok(refused.exitCode === 0 || refusalLogs.includes("Port 3100 is occupied"), "Orphan must cause single-instance or occupied-port refusal");
  assert.ok(!refusalLogs.includes("DOSSARA_ALPHA_READY")); assert.deepEqual(snapshot(orphan.pid), orphan);
  if (refused.exitCode === null) killVerified(snapshot(refused.pid));
  results.scenarios.push({ scenario: "orphan refusal", result: "PASS", orphan, logs: refusalLogs, limitation: "No automatic orphan cleanup. A surviving Electron child can retain the singleton lock; otherwise the occupied port refuses startup. Verified test harness cleanup only." });
  killVerified(orphan); testOrphan = undefined; await waitFree();
}
function interruptedApply(target, suffix = "recovered") {
  // Use the existing service fault hook with the server stopped. The browser then
  // qualifies reconstruction and recovery against the unmodified runtime APIs.
  const source = file => path.join(repo, file).replaceAll("\\", "/");
  const fixturePath = path.join(evidenceDir, suffix + "-fault.test.ts");
  const outputPath = path.join(evidenceDir, suffix + "-fault-result.json");
  const emptyPath = path.join(evidenceDir, "server-only.js");
  const configPath = path.join(evidenceDir, "fault.config.cjs");
  fs.writeFileSync(emptyPath, "module.exports = {};\n");
  fs.writeFileSync(configPath, "module.exports = " + JSON.stringify({
    resolve: { alias: { "@": source("src"), "server-only": emptyPath } },
    test: { include: [fixturePath.replaceAll("\\", "/")], testTimeout: 60000, fileParallelism: false }
  }));
  fs.writeFileSync(fixturePath, `import { it, expect } from ${JSON.stringify(source("node_modules/vitest/dist/index.js"))};
import { randomUUID } from "node:crypto";
import { writeFile } from "node:fs/promises";
import { resolveSafeMatterForMutation } from ${JSON.stringify(source("src/lib/sdj-matters.ts"))};
import { readCanonicalMatterState } from ${JSON.stringify(source("src/lib/sdj-canonical-mutation.ts"))};
import { registerAlphaEvidence, createNextStepProposal, reviewNextStep } from ${JSON.stringify(source("src/lib/sdj-next-step-review.ts"))};
it("prepare supported interrupted apply fixture", async () => {
  const target = ${JSON.stringify(target)};
  const matter = await resolveSafeMatterForMutation(target.clientFolder, target.matterFolder);
  const evidence = await registerAlphaEvidence(matter, new File(["Synthetic recovery evidence"], "recovery.txt", { type: "text/plain" }));
  const base = await readCanonicalMatterState(matter);
  const proposal = await createNextStepProposal(matter, { evidenceId: evidence.evidenceId, originalResult: "Preserved recovery fixture draft", nextStep: ${JSON.stringify("Electron " + suffix + " step")}, baseToken: base.readToken, baseRevision: base.acceptedRevisionId! });
  const review = { reviewId: randomUUID(), proposalId: proposal.proposalId, decision: "approve" as const, value: proposal.nextStep, lawyerId: "STAGE-D-LAWYER", lawyerName: "Synthetic Electron lawyer", baseToken: proposal.baseToken, baseRevision: proposal.baseRevision };
  const result = await reviewNextStep(matter, review, { faults: { failurePoint: "RECEIPT_WRITE" } });
  expect(result.code).toBe("RECOVERY_REQUIRED");
  await writeFile(${JSON.stringify(outputPath)}, JSON.stringify({ evidence, proposal, review, result }));
});`);
  const output = execFileSync("C:\\Program Files\\nodejs\\node.exe", [source("node_modules/vitest/vitest.mjs"), "run", "--no-cache", "--config", configPath], { cwd: repo, encoding: "utf8", windowsHide: true, timeout: 90000 });
  fs.writeFileSync(path.join(evidenceDir, suffix + "-fault-hook.log"), output);
  return JSON.parse(fs.readFileSync(outputPath, "utf8"));
}
async function alpha() {
  assert.ok(await portFree());
  const clientFolder = "STAGE_D_SYNTHETIC";
  const matterFolder = "SDJ_ALPHA_" + crypto.randomUUID();
  const matter = path.join(root, "01 KLIJENTI", clientFolder, matterFolder);
  for (const name of ["00 CONTROL", "01 ULAZ", "02 RADNO", "03 FINALNO", "04 AI"]) fs.mkdirSync(path.join(matter, name), { recursive: true });
  const canonical = path.join(matter, "00 CONTROL/command-center.md");
  const initial = Buffer.from("# Command Center\r\nKlijent: STAGE_D_SYNTHETIC\r\nPredmet: Synthetic Electron Alpha\r\nOblast prava: Ugovorno pravo\r\nVrsta predmeta: Ugovorni predmet\r\nSledeći korak: Initial Electron step\r\nStatus: Aktivan\r\n");
  fs.writeFileSync(canonical, initial);
  const inputPath = path.join(evidenceDir, "evidence.txt"); fs.writeFileSync(inputPath, "Synthetic Electron evidence only\r\n");
  const target = { clientFolder, matterFolder }, query = new URLSearchParams(target).toString();
  const url = `${origin}/matters/${clientFolder}/${matterFolder}`;
  let item = await launch(), page = await ready(item);
  await page.goto(url);
  const errors = []; page.on("pageerror", error => errors.push(error.message));
  const panel = () => page.locator("section").filter({ has: page.getByRole("heading", { name: "Dokaz → pregledan sledeći korak" }) });
  const state = async () => await page.evaluate(async q => await (await fetch("/api/matters/next-step-review?" + q)).json(), query);
  async function click(name) {
    const received = page.waitForResponse(r => r.url().includes("/api/matters/") && r.request().method() !== "GET");
    await page.getByRole("button", { name, exact: true }).click(); const response = await received;
    const value = { status: response.status(), body: await response.json() }; await delay(300); return value;
  }
  async function register() {
    await panel().getByLabel("Prijem jednog dokaznog fajla", { exact: true }).setInputFiles(inputPath);
    const response = await click("Registruj dokaz"); assert.equal(response.status, 201);
    assert.deepEqual(fs.readFileSync(path.join(matter, response.body.relativePath)), fs.readFileSync(inputPath));
    await page.getByLabel("Identifikator pravnika", { exact: true }).fill("STAGE-D-LAWYER");
    await page.getByLabel("Ime pravnika", { exact: true }).fill("Synthetic Electron lawyer");
    return response.body;
  }
  async function propose(value) {
    await panel().locator("textarea").fill("Preserved synthetic original result: " + value);
    await panel().getByLabel("Predloženi sledeći korak", { exact: true }).fill(value);
    const response = await click("Sačuvaj prijedlog"); assert.equal(response.status, 201); return response.body;
  }
  async function review(proposal) {
    await panel().locator("article").filter({ hasText: proposal.nextStep }).getByRole("button", { name: "Pregled prema trenutno prihvaćenoj verziji", exact: true }).click();
    await page.getByLabel("Konačni sledeći korak", { exact: true }).waitFor();
  }
  function onlyNext(before, value) { assert.equal(fs.readFileSync(canonical, "utf8"), before.toString().replace(/(Sledeći korak:)[^\r\n]*/u, "$1 " + value)); }
  await page.getByRole("button", { name: "Uredi sledeći korak", exact: true }).click(); assert.equal((await click("Prihvati pregledanu verziju")).status, 200); await page.reload();
  const evidence = await register();
  let proposal = await propose("Electron approved step"); await review(proposal); let before = fs.readFileSync(canonical);
  const approval = await click("Odobri"); assert.equal(approval.status, 200); onlyNext(before, proposal.nextStep);
  results.scenarios.push({ scenario: "approve", result: "PASS", proposal, approval, hash: sha(fs.readFileSync(canonical)) });
  const approved = (await state()).proposals.find(p => p.proposal.proposalId === proposal.proposalId).reviews[0];
  const payload = { ...target, action: "recover", reviewId: approved.review.reviewId, proposalId: proposal.proposalId, decision: approved.review.decision, value: approved.review.value,
    lawyerId: approved.review.lawyerId, lawyerName: approved.review.lawyerName, baseToken: approved.review.baseToken, baseRevision: approved.review.baseRevision };
  before = fs.readFileSync(canonical);
  const replay = await page.evaluate(async data => { const r = await fetch("/api/matters/next-step-review", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }); return { status: r.status, body: await r.json() }; }, payload);
  assert.equal(replay.status, 200); assert.deepEqual(replay.body, approval.body); assert.deepEqual(fs.readFileSync(canonical), before);
  const changed = await page.evaluate(async data => { const r = await fetch("/api/matters/next-step-review", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }); return r.status; }, { ...payload, value: "Changed identity payload" }); assert.equal(changed, 400);
  results.scenarios.push({ scenario: "exact retry + changed payload", result: "PASS", reviewId: approved.review.reviewId, transactionId: approval.body.transactionId });
  const sourceWindow = item.app.waitForEvent("window");
  await panel().locator("article").filter({ hasText: proposal.nextStep }).getByRole("link", { name: "evidence.txt", exact: true }).click();
  const viewer = await sourceWindow; await viewer.waitForURL(value => value.href.startsWith(origin + "/api/matters/file?"), { timeout: 30000 }); await viewer.waitForLoadState();
  assert.ok(viewer.url().startsWith(origin + "/api/matters/file?")); assert.ok((await viewer.locator("body").innerText()).includes("Synthetic Electron evidence"));
  assert.equal(await viewer.evaluate(() => typeof window.sdj), "undefined");
  const sourceUrl = viewer.url(); await viewer.evaluate(value => { window.location.href = value; }, origin + "/matters"); await delay(300); assert.equal(viewer.url(), sourceUrl);
  assert.equal(await page.evaluate(value => window.open(value) === null, "http://127.0.0.1:3101/unapproved"), true);
  assert.equal(await page.evaluate(async () => { try { await fetch("/api/matters/file", { method: "POST", body: "{}" }); return false; } catch { return true; } }), true);
  assert.equal(await viewer.evaluate(async () => { try { await fetch("/api/matters/next-step-review", { method: "POST", body: "{}" }); return false; } catch { return true; } }), true);
  await capture(viewer, "source-viewer"); await viewer.close();
  results.scenarios.push({ scenario: "restricted source viewer", result: "PASS" });
  proposal = await propose("Electron original before modification"); await review(proposal); await page.getByLabel("Konačni sledeći korak", { exact: true }).fill("Electron lawyer modified step"); before = fs.readFileSync(canonical);
  const modified = await click("Izmijeni i odobri"); assert.equal(modified.status, 200); onlyNext(before, "Electron lawyer modified step"); results.scenarios.push({ scenario: "modify + approve", result: "PASS", proposal, modified });
  proposal = await propose("Electron lost response step"); await review(proposal); before = fs.readFileSync(canonical);
  await page.evaluate(() => {
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      const response = await originalFetch(...args);
      if (String(args[0]).includes("next-step-review") && args[1]?.body && JSON.parse(String(args[1].body)).action === "review") {
        window.fetch = originalFetch; await response.clone().arrayBuffer(); throw new Error("Synthetic lost response after real server success");
      }
      return response;
    };
  });
  const lost = await click("Odobri"); assert.equal(lost.status, 200); onlyNext(before, proposal.nextStep);
  const published = fs.readFileSync(canonical), publishedMtime = fs.statSync(canonical).mtimeMs;
  const repeated = await click("Izričit oporavak / ponovni pokušaj"); assert.equal(repeated.status, 200); assert.deepEqual(repeated.body, lost.body);
  assert.deepEqual(fs.readFileSync(canonical), published); assert.equal(fs.statSync(canonical).mtimeMs, publishedMtime);
  results.scenarios.push({ scenario: "lost response + explicit UI retry", result: "PASS", qualification: "Actual request completed; client test shim discarded only the response", lost, repeated });
  proposal = await propose("Electron rejected step"); await review(proposal); before = fs.readFileSync(canonical); const rejected = await click("Odbij"); assert.equal(rejected.status, 200); assert.deepEqual(fs.readFileSync(canonical), before); results.scenarios.push({ scenario: "reject", result: "PASS", proposal, rejected });
  proposal = await propose("Electron stale step"); await review(proposal); fs.writeFileSync(canonical, fs.readFileSync(canonical, "utf8").replace(/(Sledeći korak:)[^\r\n]*/u, "$1 Electron controlled external edit")); before = fs.readFileSync(canonical);
  const stale = await click("Odobri"); assert.equal(stale.status, 409); assert.equal(stale.body.code, "CONFLICT"); assert.deepEqual(fs.readFileSync(canonical), before); results.scenarios.push({ scenario: "stale base", result: "PASS", proposal, stale });
  await page.reload(); await page.getByRole("button", { name: "Uredi sledeći korak", exact: true }).click(); assert.equal((await click("Prihvati eksterno izmijenjenu verziju")).status, 200); await page.reload(); await register();
  const pending = await propose("Electron pending restart step"); const beforeRestart = await state(); await capture(page, "alpha-before-restart"); await close(item);
  item = await launch(); page = await ready(item); await page.goto(url); await page.getByRole("button", { name: "Učitaj / ponovo učitaj Alpha tok", exact: true }).click(); await delay(500); assert.deepEqual(await state(), beforeRestart);
  assert.ok((await state()).proposals.find(p => p.proposal.proposalId === pending.proposalId && p.reviews.length === 0));
  results.scenarios.push({ scenario: "cold completed + pending proposal", result: "PASS", pending });
  assert.deepEqual(fs.readFileSync(path.join(matter, evidence.relativePath)), fs.readFileSync(inputPath));
  results.matter = matter; results.consoleErrors = errors; assert.deepEqual(errors, []);
  await capture(page, "alpha-cold-restart"); await close(item);
  assert.ok(await portFree()); const fault = interruptedApply(target); before = fs.readFileSync(canonical); const beforeMtime = fs.statSync(canonical).mtimeMs;
  item = await launch(); page = await ready(item); await page.goto(url);
  await page.getByRole("button", { name: "Učitaj / ponovo učitaj Alpha tok", exact: true }).click();
  const recoveryArticle = panel().locator("article").filter({ hasText: fault.proposal.nextStep });
  await recoveryArticle.getByRole("button", { name: "Izričit oporavak / ponovni pokušaj", exact: true }).waitFor();
  assert.ok((await recoveryArticle.innerText()).includes("Upis zahtijeva provjeru"));
  const excluded = await page.evaluate(async data => {
    const values = [];
    for (const [endpoint, body] of [["/api/matters/delete", data.target], ["/api/matters/command-center", { ...data.target, expectedReadToken: data.token }]]) {
      const response = await fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }); values.push({ endpoint, status: response.status, body: await response.json() });
    }
    return values;
  }, { target, token: sha(before) });
  assert.ok(excluded.every(value => value.status === 409 && value.body.code === "RECOVERY_REQUIRED"));
  assert.ok(fs.existsSync(matter)); assert.deepEqual(fs.readFileSync(canonical), before);
  await capture(page, "recovery-required");
  const recovered = await click("Izričit oporavak / ponovni pokušaj"); assert.equal(recovered.status, 200);
  assert.deepEqual(fs.readFileSync(canonical), before); assert.equal(fs.statSync(canonical).mtimeMs, beforeMtime);
  results.scenarios.push({ scenario: "cold interrupted apply + explicit recovery", result: "PASS", setup: "Existing RECEIPT_WRITE service fault hook while server stopped", fault, recovered, hash: sha(before) });
  results.scenarios.push({ scenario: "pending archive/delete and baseline exclusion", result: "PASS", qualification: "Actual Electron renderer fetch to real server APIs; no archive/delete button in the accepted UI", excluded });
  await capture(page, "recovery-success"); await close(item);
  const ambiguous = interruptedApply(target, "ambiguous");
  fs.writeFileSync(canonical, fs.readFileSync(canonical, "utf8").replace(/(Sledeći korak:)[^\r\n]*/u, "$1 Electron external edit after interrupted publication")); before = fs.readFileSync(canonical);
  item = await launch(); page = await ready(item); await page.goto(url);
  await page.getByRole("button", { name: "Učitaj / ponovo učitaj Alpha tok", exact: true }).click();
  const refusedRecovery = await click("Izričit oporavak / ponovni pokušaj"); assert.equal(refusedRecovery.status, 409); assert.equal(refusedRecovery.body.code, "RECOVERY_REQUIRED"); assert.deepEqual(fs.readFileSync(canonical), before);
  results.scenarios.push({ scenario: "ambiguous recovery refuses external hash mismatch", result: "PASS", ambiguous, refusedRecovery, hash: sha(before), limitation: "Synthetic matter intentionally remains recovery-required as evidence" });
  await capture(page, "ambiguous-recovery"); await close(item);
  const records = [];
  function recordFiles(directory) {
    for (const name of fs.readdirSync(directory)) {
      const file = path.join(directory, name), stat = fs.lstatSync(file);
      assert.ok(!stat.isSymbolicLink(), "Acceptance never follows redirected record paths");
      if (stat.isDirectory()) recordFiles(file);
      else records.push({ relativePath: path.relative(matter, file), bytes: stat.size, hash: sha(fs.readFileSync(file)) });
    }
  }
  recordFiles(path.join(matter, "00 CONTROL"));
  results.durableRecords = records;
  results.originalInput = { path: inputPath, hash: sha(fs.readFileSync(inputPath)), registered: evidence };
  results.scenarios.push({ scenario: "archive/delete button", result: "NOT QUALIFIED", limitation: "Accepted Next UI has no such control; actual server exclusion is separately qualified above" });


}
(async () => {
  try {
    if (process.argv.includes("--alpha")) await alpha(); else await lifecycle();
    results.verdict = "Targeted Electron acceptance passed";
  } catch (error) { results.errors.push(String(error.stack || error)); results.verdict = "Acceptance failed"; process.exitCode = 1; }
  finally {
    for (const item of launches) {
      if (item.process.exitCode === null) await item.app.close().catch(() => {});
    }
    if (testForeign?.listening) await new Promise(resolve => testForeign.close(resolve));
    if (testOrphan && snapshot(testOrphan.pid)) { killVerified(testOrphan); await waitFree(); }
    for (const child of testElectronChildren) if (snapshot(child.pid)) killVerified(child);
    results.runtimeLogs = launches.map(item => ({ pid: item.pid, logs: item.logs }));
    artifacts(); console.log(JSON.stringify({ verdict: results.verdict, scenarios: results.scenarios.map(s => [s.scenario, s.result]), evidenceDir, errors: results.errors }, null, 2));
    process.exit(process.exitCode || 0);
  }
})();
