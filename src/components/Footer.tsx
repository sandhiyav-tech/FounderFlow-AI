import React from "react";
import Link from "next/link";
import { Sparkles, ShieldAlert, ExternalLink } from "lucide-react";

export function Footer() {
  return (
    <footer className="w-full border-t border-border bg-card/60 backdrop-blur-sm mt-auto">
      <div className="container mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Disclaimer Bar */}
        <div className="mb-6 flex items-center gap-2.5 rounded-lg border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-xs text-amber-700 dark:text-amber-300">
          <ShieldAlert className="h-4 w-4 shrink-0" />
          <span>
            <strong>Disclaimer:</strong> AI-generated research. Verify before making decisions. FounderFlow AI provides structured early-stage venture synthesis and live web search data to assist founder discovery.
          </span>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="font-semibold text-foreground">FounderFlow AI</span>
            <span>&bull; Autonomous Startup Research Co-Pilot</span>
          </div>

          <div className="flex items-center space-x-6">
            <Link href="/" className="hover:text-foreground transition-colors">
              Home
            </Link>
            <Link href="/new" className="hover:text-foreground transition-colors">
              Validate Idea
            </Link>
            <Link href="/dashboard" className="hover:text-foreground transition-colors">
              My Reports
            </Link>
            <a
              href="https://vercel.com"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center space-x-1 hover:text-foreground transition-colors"
            >
              <span>Deploy on Vercel</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

