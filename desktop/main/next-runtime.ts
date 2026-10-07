import { execFile, spawn, type ChildProcess } from "node:child_process";
import { access, readFile, realpath, lstat } from "node:fs/promises";
import { mkdirSync, realpathSync } from "node:fs";
import path from "node:path";
import { promisify } from "node:util";

export const TEST_ROOT = "C:\\SDJ_TEST\\SDJ_LEGAL_TEST";
export const RUNTIME_ROOT = "C:\\SDJ_TOOLS\\sdj-mike-v1";
export const NODE_PATH = "C:\\Program Files\\nodejs\\node.exe";
export const NEXT_ORIGIN = "http://127.0.0.1:3100";
const run = promisify(execFile);
const systemDirectory = path.join(process.env.SystemRoot ?? "C:\\Windows", "System32");
const NETSTAT = path.join(systemDirectory, "netstat.exe");
const POWERSHELL = path.join(systemDirectory, "WindowsPowerShell", "v1.0", "powershell.exe");
const TASKKILL = path.join(systemDirectory, "taskkill.exe");
const samePath = (a: string, b: string) => path.resolve(a).toLowerCase() === path.resolve(b).toLowerCase();
const delay = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

// Stage F validation only; normal desktop launches retain the pinned checkout.
export async function resolveRuntimeRoot(env: Partial<NodeJS.ProcessEnv> = process.env): Promise<string> {
  const candidate = env.DOSSARA_STAGE_F_CANDIDATE_SOURCE;
  if (candidate === undefined) return RUNTIME_ROOT;
  if (env.DOSSARA_TEST_PROFILE !== "1" || !candidate || candidate.trim() !== candidate ||
      !/^[A-Za-z]:[\\/]/u.test(candidate) || /[<>:"|?*\u0000]/u.test(candidate.slice(2)) ||
      candidate.split(/[\\/]/u).some((part) => part === "." || part === ".." || /[. ]$/u.test(part))) {
    throw new Error("Invalid explicit Stage F candidate source path");
  }
  const resolved = path.resolve(candidate);
  const relative = path.relative(TEST_ROOT, resolved);
  if (!relative || relative === ".." || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative)) {
    throw new Error("Stage F candidate must be strictly underneath the approved test root");
  }
  // Check ancestors too: a junction to another directory inside the root is
  // still a redirected candidate, not an independently exported checkout.
  let current = TEST_ROOT;
  for (const part of ["", ...relative.split(path.sep)]) {
    if (part) current = path.join(current, part);
    if (!samePath(await realpath(current), current) || !(await lstat(current)).isDirectory() || (await lstat(current)).isSymbolicLink()) {
      throw new Error("Stage F candidate source is missing or redirected");
    }
  }
  return resolved;
}

export function validateSettings(value: unknown): void {
  if (!value || typeof value !== "object") throw new Error("Missing test workspace settings");
  const settings = value as Record<string, unknown>;
  for (const key of ["allowedTestRoot", "activeRootPath"]) {
    if (typeof settings[key] !== "string" || !samePath(settings[key], TEST_ROOT)) throw new Error("Alpha desktop supports only the approved test root");
  }
}

// Browser caches are technical test artifacts, never canonical/workflow state.
export function prepareTestProfile(): string {
  if (!samePath(realpathSync(TEST_ROOT), TEST_ROOT)) throw new Error("Test root is redirected");
  const profile = path.join(TEST_ROOT, "desktop-alpha-profile");
  mkdirSync(profile, { recursive: true });
  if (!samePath(realpathSync(profile), profile)) throw new Error("Desktop test profile is redirected");
  return profile;
}

export async function validateRuntimeInputs(): Promise<string> {
  return validateRuntimeAssets(await resolveRuntimeRoot());
}

async function validateRuntimeAssets(runtimeRoot: string): Promise<string> {
  if (process.platform !== "win32") throw new Error("Local Alpha desktop bridge is Windows-only");
  for (const location of [runtimeRoot, TEST_ROOT, NODE_PATH]) {
    if (!samePath(await realpath(location), location)) throw new Error("Approved runtime path is redirected");
  }
  const cli = path.join(runtimeRoot, "node_modules", "next", "dist", "bin", "next");
  const settingsPath = path.join(runtimeRoot, ".sdj-mike", "settings.json");
  for (const location of [cli, settingsPath, path.join(runtimeRoot, ".next", "BUILD_ID"),
    path.join(runtimeRoot, "spikes", "write-1v-v1-mutation", "windows-handle-publication.ps1")]) {
    if (!samePath(await realpath(location), location) || !(await lstat(location)).isFile()) throw new Error("Required local runtime asset is unsafe or missing");
    await access(location);
  }
  validateSettings(JSON.parse(await readFile(settingsPath, "utf8")));
  if (!(await readFile(path.join(runtimeRoot, ".next", "BUILD_ID"), "utf8")).trim()) throw new Error("Next production build is missing");
  const { stdout } = await run(NODE_PATH, ["--version"], { windowsHide: true, timeout: 5000, env: runtimeEnvironment() });
  if (stdout.trim() !== "v24.13.0") throw new Error("Node version differs from the qualified local runtime");
  return cli;
}

function runtimeEnvironment(): NodeJS.ProcessEnv {
  const result: NodeJS.ProcessEnv = { NODE_ENV: "production", NEXT_TELEMETRY_DISABLED: "1" };
  for (const key of ["SystemRoot", "WINDIR", "PATH", "TEMP", "TMP", "USERPROFILE", "LOCALAPPDATA", "APPDATA", "COMSPEC"]) {
    if (process.env[key]) result[key] = process.env[key];
  }
  return result;
}

export type Listener = { address: string; pid: number };
export function parseListeners(output: string): Listener[] {
  const result: Listener[] = [];
  for (const line of output.split(/\r?\n/u)) {
    const fields = line.trim().split(/\s+/u);
    // TCP local remote LISTENING PID (state text is language-independent in netstat).
    if (fields[0] === "TCP" && fields.length === 5 && fields[3] === "LISTENING" && /:3100$/u.test(fields[1])) {
      const pid = Number(fields[4]);
      if (!Number.isSafeInteger(pid) || pid <= 0) throw new Error("Unverifiable listener PID");
      result.push({ address: fields[1], pid });
    }
  }
  return result;
}
export async function listeners(): Promise<Listener[]> {
  const { stdout } = await run(NETSTAT, ["-ano", "-p", "tcp"], { windowsHide: true, timeout: 5000, maxBuffer: 4 * 1024 * 1024 });
  return parseListeners(stdout);
}
export function assertOwnedListener(entries: Listener[], pid: number): void {
  if (entries.length !== 1 || entries[0].address !== "127.0.0.1:3100" || entries[0].pid !== pid) throw new Error("Next listener ownership or exact loopback binding was lost");
}

type Identity = { pid: number; executable: string; command: string; created: string };
async function identity(pid: number): Promise<Identity | null> {
  if (!Number.isSafeInteger(pid) || pid <= 0) throw new Error("Invalid owned process PID");
  const script = `$p=Get-CimInstance Win32_Process -Filter 'ProcessId = ${pid}'; if($p){[pscustomobject]@{pid=$p.ProcessId; executable=$p.ExecutablePath; command=$p.CommandLine; created=$p.CreationDate.ToUniversalTime().ToString('o')}|ConvertTo-Json -Compress}`;
  const { stdout } = await run(POWERSHELL, ["-NoProfile", "-NonInteractive", "-Command", script], { windowsHide: true, timeout: 8000 });
  if (!stdout.trim()) return null;
  const value = JSON.parse(stdout) as Identity;
  if (value.pid !== pid || typeof value.created !== "string" || !value.created) throw new Error("Unverifiable owned process identity");
  return value;
}

export class OwnedNextRuntime {
  private child?: ChildProcess;
  private owner?: Identity;
  private monitor?: ReturnType<typeof setTimeout>;
  private stopping = false;
  private failed = false;
  private ready = false;
  private output = "";
  private stopPromise?: Promise<void>;
  constructor(private readonly onFailure: (error: Error) => void) {}
  get usable() { return this.ready && !this.stopping && !this.failed && this.child?.exitCode === null && this.child?.signalCode === null; }
  get pid() { return this.child?.pid; }

  private fail(error: Error) {
    if (this.stopping || this.failed) return;
    this.failed = true; this.ready = false;
    if (this.monitor) clearTimeout(this.monitor);
    this.onFailure(error);
  }
  async start(timeoutMs = 30000): Promise<void> {
    if (this.child || this.stopping) throw new Error("Runtime cannot be started twice");
    const runtimeRoot = await resolveRuntimeRoot();
    const cli = await validateRuntimeAssets(runtimeRoot);
    if ((await listeners()).length) throw new Error("Port 3100 is occupied. No existing listener will be adopted or killed. Verify any orphan manually.");
    const child = spawn(NODE_PATH, [cli, "start", runtimeRoot, "-H", "127.0.0.1", "-p", "3100"], {
      cwd: runtimeRoot, env: runtimeEnvironment(), stdio: ["ignore", "pipe", "pipe"], windowsHide: true,
    });
    this.child = child;
    child.stdout?.on("data", (data: Buffer) => { this.output = (this.output + data.toString()).slice(-8000); });
    child.stderr?.on("data", (data: Buffer) => { this.output = (this.output + data.toString()).slice(-8000); });
    child.on("error", (error) => this.fail(error));
    child.on("exit", () => this.fail(new Error("Owned Next server exited. Reopen the application; use existing Alpha recovery for interrupted work.")));
    const deadline = Date.now() + timeoutMs;
    try {
      if (!child.pid) throw new Error("Next process did not spawn");
      this.owner = await identity(child.pid) ?? undefined;
      if (!this.owner || !samePath(this.owner.executable, NODE_PATH) || !this.owner.command.includes(cli) || !this.owner.command.includes(runtimeRoot)) throw new Error("Started process identity cannot be verified");
      while (Date.now() < deadline) {
        if (this.failed || child.exitCode !== null || child.signalCode !== null) throw new Error("Next exited before readiness");
        const entries = await listeners();
        if (entries.length) {
          assertOwnedListener(entries, child.pid);
          // A foreign HTTP listener cannot pass solely by returning a plausible page.
          if (/Ready in/u.test(this.output)) {
            const response = await fetch(`${NEXT_ORIGIN}/matters`, { redirect: "error", signal: AbortSignal.timeout(Math.max(1, Math.min(10000, deadline - Date.now()))) });
            if (response.status !== 200) throw new Error("Next application readiness probe failed");
            await response.body?.cancel();
            assertOwnedListener(await listeners(), child.pid);
            this.ready = true;
            console.log(`DOSSARA_ALPHA_READY ${JSON.stringify({ pid: child.pid, origin: NEXT_ORIGIN, created: this.owner.created })}`);
            this.monitorOwnership();
            return;
          }
        }
        await delay(200);
      }
      throw new Error("Next readiness timed out");
    } catch (error) {
      await this.stop().catch((cleanup) => { console.error("DOSSARA_ALPHA_CLEANUP_FAILED", String(cleanup)); });
      throw error;
    }
  }
  private monitorOwnership() {
    this.monitor = setTimeout(() => {
      void (async () => {
        try {
          if (!this.usable || !this.child?.pid) return;
          assertOwnedListener(await listeners(), this.child.pid);
          if (this.usable) this.monitorOwnership();
        } catch (error) { this.fail(error instanceof Error ? error : new Error(String(error))); }
      })();
    }, 1000);
  }
  stop(): Promise<void> {
    this.stopPromise ??= this.stopOwned();
    return this.stopPromise;
  }
  private async stopOwned(): Promise<void> {
    this.stopping = true; this.ready = false;
    if (this.monitor) clearTimeout(this.monitor);
    const child = this.child;
    if (!child?.pid) return;
    if (child.exitCode === null && child.signalCode === null) {
      const current = await identity(child.pid);
      if (!current || !this.owner || current.created !== this.owner.created || current.command !== this.owner.command || !samePath(current.executable, this.owner.executable)) {
        throw new Error("Cannot verify owned process for termination; no unrelated process was killed");
      }
      // Windows Node kill does not establish graceful HTTP draining. Kill only the
      // verified owned tree; interrupted applies remain durable recovery cases.
      await run(TASKKILL, ["/PID", String(child.pid), "/T", "/F"], { windowsHide: true, timeout: 8000 });
    }
    const deadline = Date.now() + 10000;
    while (child.exitCode === null && child.signalCode === null && Date.now() < deadline) await delay(100);
    if (child.exitCode === null && child.signalCode === null) throw new Error("Owned Next process did not stop");
    if ((await listeners()).length) throw new Error("Port 3100 remains occupied after shutdown; existing listener was not adopted or killed");
    console.log("DOSSARA_ALPHA_STOPPED");
  }
}
