import { useEffect, useState } from "react";

import type { AppInfo } from "../shared/contracts";

type LoadState =
  | { status: "loading" }
  | { status: "ready"; appInfo: AppInfo }
  | { status: "error" };

const APP_INFO_FIELDS: ReadonlyArray<{
  key: keyof AppInfo;
  label: string;
}> = [
  { key: "appName", label: "Application" },
  { key: "appVersion", label: "Application version" },
  { key: "electronVersion", label: "Electron version" },
  { key: "nodeVersion", label: "Node.js version" },
  { key: "chromiumVersion", label: "Chromium version" },
  { key: "platform", label: "Platform" },
];

export function App() {
  const [loadState, setLoadState] = useState<LoadState>({ status: "loading" });

  useEffect(() => {
    let isActive = true;

    void window.sdj.system.getAppInfo().then(
      (appInfo) => {
        if (isActive) {
          setLoadState({ status: "ready", appInfo });
        }
      },
      () => {
        if (isActive) {
          setLoadState({ status: "error" });
        }
      },
    );

    return () => {
      isActive = false;
    };
  }, []);

  return (
    <main>
      <h1>SDJ MIKE Desktop — B0</h1>
      <p className="status" role="status" aria-live="polite">
        {loadState.status === "loading" && "IPC status: loading"}
        {loadState.status === "ready" && "IPC status: ready"}
        {loadState.status === "error" &&
          "IPC status: unable to retrieve application information"}
      </p>

      {loadState.status === "ready" && (
        <dl>
          {APP_INFO_FIELDS.map(({ key, label }) => (
            <div key={key}>
              <dt>{label}</dt>
              <dd>{loadState.appInfo[key]}</dd>
            </div>
          ))}
        </dl>
      )}
    </main>
  );
}
