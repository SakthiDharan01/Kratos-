import type { Metadata } from "next";
import { Oswald, VT323 } from "next/font/google";
import "./globals.css";

const oswald = Oswald({
  variable: "--font-oswald",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const vt323 = VT323({
  variable: "--font-vt323",
  subsets: ["latin"],
  weight: "400",
});

export const metadata: Metadata = {
  title: "KRATOS'26 — Coming Soon",
  description:
    "Association of Computer Engineers · Easwari Engineering College, Ramapuram — temporal monitoring teaser",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${oswald.variable} ${vt323.variable}`}>
      <body>{children}</body>
    </html>
  );
}
