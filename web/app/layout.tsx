import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PaperworkPro",
  description:
    "AI-assisted paperwork review workflow for structured extraction, risk flagging, and human review routing."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
