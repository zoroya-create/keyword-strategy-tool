import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SEOキーワード戦略ツール",
  description: "ビジネス戦略からSEOキーワードを自動生成",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body className="bg-slate-50 min-h-screen">{children}</body>
    </html>
  );
}
