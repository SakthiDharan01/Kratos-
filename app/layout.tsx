import "./globals.css";
import type { Metadata } from "next";
import { Exo_2 } from "next/font/google";

const exo2 = Exo_2({
  subsets: ["latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
  variable: "--font-exo2",
});

export const metadata: Metadata = {
  title: "Kratos 2k25 - Multi-Event Platform",
  description: "Register for technical and non-technical events at Kratos 2025 - National Level Technical Symposium by Easwari Engineering College",
  icons: {
    icon: '/assets/Badge.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${exo2.variable} font-sans`}>
        {children}
        <script defer async src="https://apply.devfolio.co/v2/sdk.js"></script>
      </body>
    </html>
  );
}
