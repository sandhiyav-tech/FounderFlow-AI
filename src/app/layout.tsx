import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { ThemeProvider } from "@/components/ThemeToggle";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
});

export const metadata: Metadata = {
  title: "FounderFlow AI — Autonomous Early-Stage Startup Research Agent",
  description:
    "Automate early-stage venture validation with live web research, competitor intelligence, Mom Test discovery questions, and human-in-the-loop approvals.",
  keywords: ["startup research", "business validation", "competitor analysis", "market sizing", "founder agent", "AI research"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${jakarta.variable} font-sans min-h-screen flex flex-col bg-background text-foreground antialiased`}>
        <ThemeProvider>
          <Navbar />
          <main className="flex-1">{children}</main>
          <Footer />
        </ThemeProvider>
      </body>
    </html>
  );
}

