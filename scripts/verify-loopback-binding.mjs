import { spawn } from "node:child_process";
import { createServer, createConnection } from "node:net";
import { networkInterfaces } from "node:os";
import { fileURLToPath, pathToFileURL } from "node:url";

const LOOPBACK_HOST = "127.0.0.1";

export function lanIpv4Addresses(interfaces = networkInterfaces()) {
  return Object.values(interfaces)
    .flatMap((entries) => entries ?? [])
    .filter((entry) => entry.family === "IPv4" && !entry.internal)
    .map((entry) => entry.address);
}

export function connectTcp(host, port, timeoutMs = 1_500) {
  return new Promise((resolve) => {
    const socket = createConnection({ host, port });
    const finish = (result) => {
      socket.destroy();
      resolve(result);
    };
    socket.setTimeout(timeoutMs, () => finish({ connected: false, reason: "timeout" }));
    socket.once("connect", () => finish({ connected: true, reason: "connected" }));
    socket.once("error", (error) => finish({
      connected: false,
      reason: error.code ?? error.message,
    }));
  });
}

async function availablePort() {
  return new Promise((resolve, reject) => {
    const server = createServer();
    server.once("error", reject);
    server.listen(0, LOOPBACK_HOST, () => {
      const address = server.address();
      if (!address || typeof address === "string") {
        server.close();
        reject(new Error("Unable to allocate a loopback port"));
        return;
      }
      server.close((error) => error ? reject(error) : resolve(address.port));
    });
  });
}

async function waitForLoopback(port, child, timeoutMs = 60_000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (child.exitCode !== null) {
      throw new Error(`Next.js exited before binding (exit ${child.exitCode})`);
    }
    const result = await connectTcp(LOOPBACK_HOST, port, 500);
    if (result.connected) return result;
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error(`Timed out waiting for ${LOOPBACK_HOST}:${port}`);
}

async function stopProcessTree(child) {
  if (child.exitCode !== null) return;
  if (process.platform === "win32") {
    await new Promise((resolve, reject) => {
      const killer = spawn("taskkill.exe", ["/PID", String(child.pid), "/T", "/F"], {
        stdio: "ignore",
        windowsHide: true,
      });
      killer.once("close", (code) => code === 0
        ? resolve()
        : reject(new Error(`Unable to stop Next.js process tree (taskkill exit ${code})`)));
      killer.once("error", reject);
    });
    child.stdout?.destroy();
    child.stderr?.destroy();
    child.stdin?.destroy();
    child.unref();
    return;
  }
  child.kill("SIGTERM");
  child.stdout?.destroy();
  child.stderr?.destroy();
}

export async function verifyNextLoopback(mode = "start") {
  if (mode !== "start" && mode !== "dev") {
    throw new Error("Mode must be 'start' or 'dev'");
  }
  const lanAddresses = lanIpv4Addresses();
  if (lanAddresses.length === 0) {
    throw new Error("No non-loopback LAN IPv4 address is available for the negative probe");
  }
  const port = await availablePort();
  const nextCli = fileURLToPath(new URL("../node_modules/next/dist/bin/next", import.meta.url));
  const child = spawn(process.execPath, [
    nextCli,
    mode,
    "-H",
    LOOPBACK_HOST,
    "--port",
    String(port),
  ], {
    cwd: process.cwd(),
    env: { ...process.env, NEXT_TELEMETRY_DISABLED: "1" },
    stdio: ["ignore", "pipe", "pipe"],
    windowsHide: true,
  });
  let output = "";
  child.stdout.on("data", (chunk) => { output += chunk.toString(); });
  child.stderr.on("data", (chunk) => { output += chunk.toString(); });

  try {
    const loopback = await waitForLoopback(port, child);
    const lanResults = [];
    for (const address of lanAddresses) {
      lanResults.push({ address, ...await connectTcp(address, port) });
    }
    const exposed = lanResults.filter((result) => result.connected);
    if (exposed.length > 0) {
      throw new Error(`Server accepted LAN connection(s): ${exposed.map((item) => item.address).join(", ")}`);
    }
    return { mode, port, loopback, lanResults };
  } catch (error) {
    throw new Error(`${error instanceof Error ? error.message : String(error)}\n${output}`);
  } finally {
    await stopProcessTree(child);
  }
}

if (process.argv[1] && pathToFileURL(fileURLToPath(import.meta.url)).href === pathToFileURL(process.argv[1]).href) {
  const result = await verifyNextLoopback(process.argv[2] ?? "start");
  console.log(JSON.stringify({ status: "PASS", ...result }, null, 2));
}
