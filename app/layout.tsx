import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CC 生鮮 - 產地直達，鮮味直送 | 急凍真鮮冷鏈宅配",
  description:
    "CC 生鮮提供頂級海鮮、極品肉品急速冷凍真空鎖鮮，24 小時全程低溫冷鏈宅配，定點交貨安心取，鎖住食材最初的新鮮甜美。",
  openGraph: {
    title: "CC 生鮮 - 產地直達，鮮味直送",
    description: "急凍真鮮 · 日日直送。專業低溫宅配，鎖住最初的鮮甜。",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-Hant">
      <body>{children}</body>
    </html>
  );
}
