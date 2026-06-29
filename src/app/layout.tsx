import type { Metadata } from "next";
import fs from "fs/promises";
import path from "path";
import "./globals.css";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "우리 반 공부숲 | Our Class Study Forest",
  description: "학급의 성장을 함께 가꾸는 우리 반 공부숲",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  let termsContent = "";
  let privacyContent = "";
  try {
    const termsPath = path.join(process.cwd(), "이용약관.md");
    const privacyPath = path.join(process.cwd(), "개인정보처리방침.md");
    termsContent = await fs.readFile(termsPath, "utf-8");
    privacyContent = await fs.readFile(privacyPath, "utf-8");
  } catch (error) {
    console.error("Failed to load terms/privacy files", error);
  }

  return (
    <html lang="ko" className="h-full antialiased">
      <body className="min-h-full flex flex-col font-sans bg-background text-foreground">
        {children}
        <Footer termsContent={termsContent} privacyContent={privacyContent} />
      </body>
    </html>
  );
}
