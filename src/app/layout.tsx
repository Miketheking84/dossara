import type { Metadata } from "next";
import { connection } from "next/server";
import { NextIntlClientProvider } from "next-intl";
import { getLocale } from "next-intl/server";
import { BRAND } from "@/brand/config";
import { Sidebar } from "./components/sidebar";
import "./globals.css";

export const metadata: Metadata = {
  title: BRAND.applicationTitle,
  description: BRAND.metadataDescription,
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  await connection();
  const locale = await getLocale();

  return (
    <html lang={locale}>
      <body>
        <NextIntlClientProvider>
          <div className="app-shell">
            <Sidebar />
            <main className="workspace">{children}</main>
          </div>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
