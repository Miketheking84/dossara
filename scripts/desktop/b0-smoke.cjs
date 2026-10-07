// eslint-disable-next-line @typescript-eslint/no-require-imports
const fs = require("node:fs");

// eslint-disable-next-line @typescript-eslint/no-require-imports
const path = require("node:path");

const projectRoot = path.resolve(__dirname, "..", "..");
const requiredFiles = [
  "desktop/main/index.ts",
  "desktop/main/ipc/system.ipc.ts",
  "desktop/main/security/validate-sender.ts",
  "desktop/preload/index.ts",
  "desktop/renderer/index.html",
  "desktop/renderer/main.tsx",
  "desktop/renderer/App.tsx",
  "desktop/renderer/global.d.ts",
  "desktop/renderer/styles.css",
  "desktop/shared/contracts.ts",
  "forge.config.ts",
  "webpack.main.config.ts",
  "webpack.renderer.config.ts",
  "webpack.rules.ts",
  "tsconfig.desktop.json",
];

function fail(message) {
  throw new Error(`B0 smoke failed: ${message}`);
}

function read(relativePath) {
  return fs.readFileSync(path.join(projectRoot, relativePath), "utf8");
}

function requireMatch(content, pattern, description) {
  if (!pattern.test(content)) {
    fail(description);
  }
}

for (const relativePath of requiredFiles) {
  if (!fs.statSync(path.join(projectRoot, relativePath)).isFile()) {
    fail(`missing required file: ${relativePath}`);
  }
}

const packageJson = JSON.parse(read("package.json"));
const requiredScripts = {
  "desktop:start": "electron-forge start",
  "desktop:package": "electron-forge package",
  "desktop:smoke": "node scripts/desktop/b0-smoke.cjs",
};

if (packageJson.main !== "./.webpack/main") {
  fail("package main must be ./.webpack/main");
}

for (const [name, command] of Object.entries(requiredScripts)) {
  if (packageJson.scripts?.[name] !== command) {
    fail(`unexpected ${name} script`);
  }
}

const declaredPackages = {
  ...(packageJson.dependencies ?? {}),
  ...(packageJson.devDependencies ?? {}),
};
const forbiddenPackages = [
  "webpack-cli",
  "@electron-forge/plugin-vite",
  "@electron-forge/plugin-fuses",
  "@electron-forge/plugin-auto-unpack-natives",
];

for (const packageName of forbiddenPackages) {
  if (Object.hasOwn(declaredPackages, packageName)) {
    fail(`forbidden direct dependency: ${packageName}`);
  }
}

for (const packageName of Object.keys(declaredPackages)) {
  if (packageName.startsWith("@electron-forge/maker-")) {
    fail(`maker must not be a direct dependency: ${packageName}`);
  }
}

const mainSource = read("desktop/main/index.ts");
const preloadSource = read("desktop/preload/index.ts");
const contractsSource = read("desktop/shared/contracts.ts");
const forgeSource = read("forge.config.ts");
const rendererHtml = read("desktop/renderer/index.html");
const desktopSource = requiredFiles
  .filter((file) => file.startsWith("desktop/") && !file.endsWith(".css"))
  .map(read)
  .join("\n");

for (const [pattern, description] of [
  [/nodeIntegration\s*:\s*true/, "nodeIntegration must not be true"],
  [/contextIsolation\s*:\s*false/, "contextIsolation must not be false"],
  [/sandbox\s*:\s*false/, "sandbox must not be false"],
  [/shell\.openExternal/, "external URL opening is forbidden"],
  [/<webview\b/i, "webview is forbidden"],

  [/\b(?:writeFile|appendFile|rename|rm|unlink)\b/, "legal filesystem writes are forbidden in shell source"],

  [/from\s+["'](?:\.\.\/)+src\//, "desktop source must not import src"],
]) {
  if (pattern.test(desktopSource)) {
    fail(description);
  }
}

requireMatch(mainSource, /app\.enableSandbox\(\)/, "global sandbox is missing");
requireMatch(mainSource, /requestSingleInstanceLock\(\)/, "single-instance lock is missing");
requireMatch(mainSource, /setWindowOpenHandler\(\(\) => \(\{ action: "deny" \}\)\)/, "window-open deny rule is missing");
requireMatch(preloadSource, /contextBridge\.exposeInMainWorld\("sdj", desktopApi\)/, "preload bridge is missing");
requireMatch(preloadSource, /getAppInfo: \(\) => ipcRenderer\.invoke\(SYSTEM_GET_APP_INFO_CHANNEL\)/, "preload API is not fixed to the approved channel");

const channelDeclarations = contractsSource.match(/system:get-app-info/g) ?? [];
if (channelDeclarations.length !== 1) {
  fail("the shared contract must declare exactly one IPC channel");
}

if (/ipcRenderer\.(?:send|sendSync|postMessage)|ipcRenderer\.invoke\([^S]/.test(preloadSource)) {
  fail("preload contains a generic IPC primitive");
}

requireMatch(forgeSource, /makers:\s*\[\]/, "Forge makers must be empty");
requireMatch(forgeSource, /asar:\s*true/, "ASAR packaging must be enabled");
requireMatch(forgeSource, /packageSourceMaps:\s*false/, "packaged source maps must be disabled");

const packagedCsp = "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; font-src 'self'; connect-src 'none'; object-src 'none'; frame-src 'none'; base-uri 'none'; form-action 'none';";
if (!rendererHtml.includes(packagedCsp)) {
  fail("packaged CSP does not match the approved policy");
}

if (/unsafe-eval|unsafe-inline/.test(rendererHtml)) {
  fail("packaged CSP contains an unsafe directive");
}

const runtimeSource = read("desktop/main/next-runtime.ts");
const policySource = read("desktop/main/security/next-runtime-policy.ts");
requireMatch(mainSource, /process\.env\.DOSSARA_ALPHA === "1"/, "Alpha must be opt-in");
requireMatch(mainSource, /else createMainWindow\(\)/, "B0 rollback path is missing");
requireMatch(runtimeSource, /127\.0\.0\.1:3100/, "Alpha exact loopback origin is missing");
requireMatch(runtimeSource, /assertOwnedListener/, "Alpha listener ownership check is missing");
requireMatch(policySource, /setPermissionRequestHandler/, "Alpha permission deny policy is missing");
requireMatch(policySource, /documentNavigation/, "restricted document policy is missing");
for (const source of [runtimeSource, policySource]) {
  if (/from\s+["'](?:\.\.\/)+src\//.test(source) || /(?:mutateMatter|reviewNextStep|registerAlphaEvidence|applyReviewedNextStep)/.test(source)) fail("Shell helpers must not contain business logic");
}
const b0Source = requiredFiles.filter(file => file.startsWith("desktop/") && file !== "desktop/main/index.ts").map(read).join("\n");
if (/\bchild_process\b|\bhttps?:\/\/|\b(?:readFile|writeFile|appendFile|mkdir|rename|rm|unlink)\b/.test(b0Source)) fail("B0 renderer/preload/IPC must retain their original process/filesystem isolation");
console.log("B0 and local Alpha boundary smoke checks passed.");
