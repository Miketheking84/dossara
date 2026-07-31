import type { Metadata } from "next";
import { BRAND } from "@/brand/config";
import { Sidebar } from "./components/sidebar";
import "./globals.css";

export const metadata: Metadata = {
  title: BRAND.applicationTitle,
  description: BRAND.metadataDescription,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="sr-Latn">
      <body>
        <div className="app-shell">
          <Sidebar />
          <main className="workspace">{children}</main>
        </div>
      </body>
    </html>
  );
}
