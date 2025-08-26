import "./globals.css";
import type { Metadata } from "next";
import { Zen_Dots } from "next/font/google";

const inter = Zen_Dots({
  subsets: ["latin"],
  weight: ["400"],
});

export const metadata: Metadata = {
  title: "Kratos 2k25 - Multi-Event Platform",
  description:
    "Register for technical and non-technical events at TechFest 2024",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
