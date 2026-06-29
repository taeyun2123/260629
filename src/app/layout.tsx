import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "우리 반 공부숲 | Our Class Study Forest",
  description: "학급의 성장을 함께 가꾸는 우리 반 공부숲",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className="h-full antialiased">
      <body className="min-h-full flex flex-col font-sans bg-background text-foreground">
        {children}
      </body>
    </html>
  );
}
