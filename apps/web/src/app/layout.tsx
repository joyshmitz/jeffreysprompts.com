import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Providers } from "@/components/Providers";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "JeffreysPrompts.com - Curated Prompts for Agentic Coding",
  description:
    "A curated collection of battle-tested prompts for AI coding agents. Browse, copy, and install as Claude Code skills.",
  keywords: [
    "prompts",
    "AI",
    "coding",
    "Claude Code",
    "agentic",
    "developer tools",
  ],
  authors: [{ name: "Jeffrey Emanuel", url: "https://twitter.com/doodlestein" }],
  creator: "Jeffrey Emanuel",
  openGraph: {
    title: "JeffreysPrompts.com",
    description: "Curated prompts for agentic coding",
    url: "https://jeffreysprompts.com",
    siteName: "JeffreysPrompts.com",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "JeffreysPrompts.com",
    description: "Curated prompts for agentic coding",
    creator: "@doodlestein",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Providers>
          <Nav />
          <main className="min-h-screen">{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
