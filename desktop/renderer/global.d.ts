interface Window {
  readonly sdj: import("../shared/contracts").SdjDesktopApi;
}

declare module "*.css?sheet" {
  const stylesheet: CSSStyleSheet;
  export default stylesheet;
}
