import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sector Idea Dashboard",
  description: "Fresh ideas from YouTube podcasts and Reddit in the last 48 hours.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
