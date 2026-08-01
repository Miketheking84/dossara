import { getRequestConfig } from "next-intl/server";
import { getLocalePreference } from "@/lib/locale-preference";
import { DEFAULT_LOCALE, type AppLocale } from "./config";
import { getMessages, getMissingMessageFallback } from "./messages";

function reportTranslationError(error: unknown) {
  console.error(error);
}

export default getRequestConfig(async () => {
  const locale: AppLocale = (await getLocalePreference()) ?? DEFAULT_LOCALE;

  return {
    locale,
    messages: getMessages(locale),
    onError: reportTranslationError,
    getMessageFallback: ({ namespace, key }) => getMissingMessageFallback(namespace, key),
  };
});
