/**
 * LAYOUT.TSX — Wraps every page in the app
 * =========================================
 * Sets the browser tab title and loads global styles.
 * All pages share this shell automatically.
 */

import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Load Builder — Walmart → SHV Logistics",
  description: "Fetch Walmart freight tenders, sanitize, and push to SHV TMS",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
