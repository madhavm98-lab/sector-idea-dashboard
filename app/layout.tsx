import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Sector Idea Dashboard",
  description: "Live investment idea flow from Reddit & YouTube — 48h rolling window",
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
