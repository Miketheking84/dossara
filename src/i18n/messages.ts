import en from "./messages/en.json";
import srLatn from "./messages/sr-Latn.json";
import type { AppLocale } from "./config";

export type TranslationMessages = typeof en;

type MessageValue = string | { readonly [key: string]: MessageValue };

export function mergeMessages<T extends MessageValue>(fallback: T, primary: T): T {
  if (typeof fallback === "string" || typeof primary === "string") {
    return primary;
  }

  const result: Record<string, MessageValue> = {
    ...(fallback as Record<string, MessageValue>),
  };
  for (const [key, value] of Object.entries(primary as Record<string, MessageValue>)) {
    result[key] = key in (fallback as Record<string, MessageValue>)
      ? mergeMessages((fallback as Record<string, MessageValue>)[key] as MessageValue, value)
      : value;
  }
  return result as T;
}

export function getMessages(locale: AppLocale): TranslationMessages {
  return locale === "sr-Latn"
    ? mergeMessages(en, srLatn)
    : en;
}

export function messageKeys(messages: MessageValue, prefix = ""): string[] {
  return Object.entries(messages).flatMap(([key, value]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    return typeof value === "string" ? [path] : messageKeys(value, path);
  });
}

export function getMissingMessageFallback(namespace: string | undefined, key: string): string {
  return `[missing:${namespace ?? "global"}.${key}]`;
}
