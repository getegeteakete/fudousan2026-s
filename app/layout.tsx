import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PropSign | 不動産電子契約システム",
  description: "不動産取引に特化した電子契約・電子署名プラットフォーム",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body>{children}</body>
    </html>
  );
}
