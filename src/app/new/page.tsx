"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Sparkles, ArrowLeft, ArrowRight, Lightbulb, Compass, Globe, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";

export default function NewReportPage() {
  const router = useRouter();
  const [idea, setIdea] = useState("");
  const [industry, setIndustry] = useState("B2B SaaS / Productivity");
  const [region, setRegion] = useState("North America / Global");
  const [budget, setBudget] = useState("Bootstrapped ($0 - $5k)");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const industries = [
    "B2B SaaS / Productivity",
    "AI & Developer Tools",
    "Fintech & Crypto",
    "Healthcare & Biotech",
    "E-Commerce & Marketplaces",
    "Edtech & Future of Work",
    "Hardware & Robotics",
    "Climate & Clean Energy",
  ];

  const regions = [
    "North America / Global",
    "European Union (EU)",
    "United Kingdom",
    "Asia-Pacific (APAC)",
    "Latin America (LATAM)",
    "India / South Asia",
  ];

  const budgets = [
    "Bootstrapped ($0 - $5k)",
    "Pre-Seed ($5k - $25k)",
    "Seed Stage ($25k - $100k)",
    "Venture Backed ($100k+)",
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!idea.trim() || idea.trim().length < 10) {
      setError("Please describe your business idea in at least 10 characters.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idea, industry, region, budget }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to initialize research report.");
      }

      // Persist to localStorage for serverless resilience
      try {
        localStorage.setItem(`founderflow_report_${data.report.id}`, JSON.stringify(data.report));
        const indexList = JSON.parse(localStorage.getItem("founderflow_reports_index") || "[]");
        localStorage.setItem("founderflow_reports_index", JSON.stringify([data.report.id, ...indexList.filter((id: string) => id !== data.report.id)]));
      } catch {
        // ignore
      }

      router.push(`/report/${data.report.id}`);
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
      {/* Back button */}
      <div className="mb-6">
        <Link
          href="/"
          className="inline-flex items-center space-x-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Home</span>
        </Link>
      </div>

      <div className="mb-8">
        <div className="flex items-center space-x-2 text-primary text-xs font-bold uppercase tracking-wider mb-1">
          <Sparkles className="w-4 h-4" />
          <span>Autonomous Startup Intelligence</span>
        </div>
        <h1 className="text-3xl font-extrabold text-foreground tracking-tight">
          Submit New Business Idea
        </h1>
        <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
          Enter your raw startup thesis. FounderFlow AI will formulate a 7-stage research workspace with live competitor scans, customer interview questions, and human-in-the-loop review cards.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Form */}
        <div className="lg:col-span-2">
          <div className="rounded-3xl border border-border bg-card p-6 sm:p-8 shadow-sm">
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="p-3 text-xs bg-rose-500/10 border border-rose-500/30 text-rose-600 rounded-xl">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
                  Startup Idea / Value Thesis <span className="text-rose-500">*</span>
                </label>
                <Textarea
                  value={idea}
                  onChange={(e) => setIdea(e.target.value)}
                  placeholder="Describe what problem you are solving, who you are building for, and how your proposed solution works..."
                  className="min-h-[140px] text-sm"
                  required
                />
                <p className="text-[11px] text-muted-foreground mt-1.5">
                  Tip: Be as specific as possible about the target user and the core pain point.
                </p>
              </div>

              {/* Industry Chips */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 flex items-center space-x-1.5">
                  <Compass className="w-3.5 h-3.5 text-primary" />
                  <span>Target Industry</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {industries.map((ind) => (
                    <button
                      key={ind}
                      type="button"
                      onClick={() => setIndustry(ind)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                        industry === ind
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border bg-background hover:bg-muted text-muted-foreground"
                      }`}
                    >
                      {ind}
                    </button>
                  ))}
                </div>
              </div>

              {/* Region and Budget */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 flex items-center space-x-1.5">
                    <Globe className="w-3.5 h-3.5 text-primary" />
                    <span>Target Region</span>
                  </label>
                  <select
                    value={region}
                    onChange={(e) => setRegion(e.target.value)}
                    className="w-full h-10 px-3 rounded-lg border border-input bg-background text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    {regions.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 flex items-center space-x-1.5">
                    <DollarSign className="w-3.5 h-3.5 text-primary" />
                    <span>Initial Budget Stage</span>
                  </label>
                  <select
                    value={budget}
                    onChange={(e) => setBudget(e.target.value)}
                    className="w-full h-10 px-3 rounded-lg border border-input bg-background text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    {budgets.map((b) => (
                      <option key={b} value={b}>
                        {b}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="pt-4 border-t border-border flex justify-end">
                <Button
                  type="submit"
                  size="lg"
                  isLoading={isLoading}
                  className="w-full sm:w-auto px-8 shadow-md shadow-primary/25 space-x-2 font-bold"
                >
                  <span>Initialize Research Brief</span>
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </form>
          </div>
        </div>

        {/* Side Guidance Card */}
        <div className="space-y-4">
          <div className="rounded-2xl border border-border bg-card p-5 text-xs space-y-3">
            <div className="flex items-center space-x-2 text-primary font-bold">
              <Lightbulb className="w-4 h-4" />
              <span>Prompt Quality Tips</span>
            </div>
            <p className="text-muted-foreground leading-relaxed">
              For best results, mention:
            </p>
            <ul className="space-y-2 text-muted-foreground list-disc pl-4">
              <li>
                <strong className="text-foreground">Specific Target:</strong> "B2B sales managers" vs "businesses".
              </li>
              <li>
                <strong className="text-foreground">The Acute Pain:</strong> "Manual data entry takes 8 hours/week" vs "things are slow".
              </li>
              <li>
                <strong className="text-foreground">The Solution Mechanism:</strong> "Chrome extension that syncs LinkedIn with CRM" vs "an AI tool".
              </li>
            </ul>
          </div>

          <div className="rounded-2xl border border-indigo-200 dark:border-indigo-950/60 bg-indigo-50/50 dark:bg-indigo-950/20 p-5 text-xs text-indigo-900 dark:text-indigo-300">
            <strong>What happens next:</strong>
            <p className="mt-1 text-muted-foreground">
              You will be redirected to the live research workspace. Stage 1 (Idea Analysis) begins immediately, and you will approve each card before advancing.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

