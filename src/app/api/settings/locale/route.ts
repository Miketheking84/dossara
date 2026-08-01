import { NextResponse } from "next/server";
import { setLocalePreference } from "@/lib/locale-preference";
import { parseLocalePreferenceInput } from "@/lib/locale-preference-request";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, errorCode: "INVALID_LOCALE", error: "Unsupported locale." }, { status: 400 });
  }

  const locale = parseLocalePreferenceInput(body);
  if (!locale) {
    return NextResponse.json({ ok: false, errorCode: "INVALID_LOCALE", error: "Unsupported locale." }, { status: 400 });
  }

  try {
    await setLocalePreference(locale);
    return NextResponse.json({ ok: true, locale });
  } catch {
    return NextResponse.json({ ok: false, errorCode: "PREFERENCE_UNAVAILABLE", error: "Locale preference is unavailable." }, { status: 500 });
  }
}
