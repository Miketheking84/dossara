export const SYSTEM_GET_APP_INFO_CHANNEL = "system:get-app-info" as const;

export type AppInfo = {
  appName: string;
  appVersion: string;
  electronVersion: string;
  nodeVersion: string;
  chromiumVersion: string;
  platform: string;
};

export type SdjDesktopApi = {
  system: {
    getAppInfo(): Promise<AppInfo>;
  };
};
