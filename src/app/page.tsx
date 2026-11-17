"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Sparkles,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Search,
  MessageSquare,
  TrendingUp,
  Cpu,
  Compass,
  FileCheck,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";

export default function LandingPage() {
  const router = useRouter();
  const [idea, setIdea] = useState("");
  const [industry, setIndustry] = useState("AI & Developer Tools");
  const [region, setRegion] = useState("North America / Global");
  const [budget, setBudget] = useState("Bootstrapped ($0 - $5k)");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

      router.push(`/report/${data.report.id}`);
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
      setIsLoading(false);
    }
  };

  const sampleIdeas = [
    "AI copilot for compliance audits in fintech startups",
    "Micro-SaaS to turn Loom screen recordings into interactive SOPs",
    "On-demand fractional CFO platform with real-time runway forecasting",
  ];

  return (
    <div className="flex flex-col items-center justify-center">
      {/* Hero Section */}
      <section className="relative w-full pt-16 pb-20 md:pt-24 md:pb-28 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center">
        {/* Decorative ambient background glow */}
        <div className="absolute inset-0 -z-10 flex items-center justify-center">
          <div className="w-[500px] h-[350px] bg-gradient-to-tr from-primary/20 to-indigo-500/20 blur-[120px] rounded-full pointer-events-none" />
        </div>

        {/* Top Tagline Pill */}
        <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full border border-primary/30 bg-primary/10 text-primary text-xs font-semibold mb-6 animate-fade-in">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Venture Research Re-Imagined for Founders</span>
        </div>

        {/* Main Headline */}
        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-foreground max-w-4xl mx-auto leading-[1.1]">
          Validate your startup idea before writing a line of code.
        </h1>

        <p className="mt-6 text-base sm:text-lg lg:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
          FounderFlow AI turns your raw business concept into a cited, 7-stage strategic intelligence brief with live competitor research, The Mom Test customer interview scripts, and founder-approved validation.
        </p>

        {/* Quick Launch Card Form */}
        <div className="mt-12 max-w-3xl mx-auto text-left">
          <div className="rounded-3xl border border-border bg-card/90 backdrop-blur-xl p-6 sm:p-8 shadow-2xl ring-1 ring-border/50">
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="p-3 text-xs bg-rose-500/10 border border-rose-500/30 text-rose-600 rounded-xl">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
                  What is your business idea?
                </label>
                <Textarea
                  value={idea}
                  onChange={(e) => setIdea(e.target.value)}
                  placeholder="e.g. An AI-powered knowledge base for remote engineering teams that automatically documents architecture decisions from Slack conversations and GitHub PRs..."
                  className="min-h-[110px] text-sm bg-background/80"
                  required
                />
              </div>

              {/* Sample idea chips */}
              <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                <span className="font-semibold text-foreground mr-1">Try sample:</span>
                {sampleIdeas.map((sample, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setIdea(sample)}
                    className="px-2.5 py-1 rounded-lg border border-border bg-muted/40 hover:bg-muted text-[11px] transition-colors truncate max-w-[280px]"
                  >
                    {sample}
                  </button>
                ))}
              </div>

              {/* Metadata Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                <div>
                  <label className="block text-[11px] font-bold text-muted-foreground mb-1 uppercase">
                    Industry
                  </label>
                  <Input
                    type="text"
                    value={industry}
                    onChange={(e) => setIndustry(e.target.value)}
                    placeholder="e.g. Fintech, B2B SaaS"
                    className="text-xs bg-background/80"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-muted-foreground mb-1 uppercase">
                    Target Region
                  </label>
                  <Input
                    type="text"
                    value={region}
                    onChange={(e) => setRegion(e.target.value)}
                    placeholder="e.g. US, Global"
                    className="text-xs bg-background/80"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-muted-foreground mb-1 uppercase">
                    Optional Budget
                  </label>
                  <Input
                    type="text"
                    value={budget}
                    onChange={(e) => setBudget(e.target.value)}
                    placeholder="e.g. $5k - $20k"
                    className="text-xs bg-background/80"
                  />
                </div>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                  <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Human-in-the-loop: You review & approve every stage</span>
                </div>

                <Button
                  type="submit"
                  size="lg"
                  isLoading={isLoading}
                  className="w-full sm:w-auto px-8 shadow-lg shadow-primary/25 space-x-2 font-bold"
                >
                  <span>Launch Research Agent</span>
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </form>
          </div>
        </div>
      </section>

      {/* Feature Grid Section */}
      <section className="w-full py-16 bg-muted/20 border-t border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
              The 7-Stage Autonomous Research Pipeline
            </h2>
            <p className="mt-3 text-sm text-muted-foreground">
              Unlike static prompt wrappers, FounderFlow AI executes staged research workflows where each stage feeds verified context into the next.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                title: "1. Idea Thesis & SWOT",
                desc: "Uncovers underlying value propositions, revenue mechanics, and core unverified assumptions that could break your business model.",
                icon: Cpu,
              },
              {
                title: "2. Beachhead Audience",
                desc: "Segments 2-4 distinct customer profiles with burning daily pain points and recommends the highest urgency beachhead market.",
                icon: Compass,
              },
              {
                title: "3. Live Competitor Intelligence",
                desc: "Runs live Tavily web search to identify 4-8 rivals, dissect their pricing, and pinpoint the exact white-space differentiation gap.",
                icon: Search,
              },
              {
                title: "4. Market Sizing & Risks",
                desc: "Extracts TAM/SAM/SOM signals, macro tailwinds, underserved niches, and severe risks with practical mitigations.",
                icon: TrendingUp,
              },
              {
                title: "5. The Mom Test Discovery",
                desc: "Generates 10-15 non-leading customer interview questions grouped by theme to test genuine willingness to pay.",
                icon: MessageSquare,
              },
              {
                title: "6. Differentiated GTM Playbooks",
                desc: "Compares 3-5 distinct strategic options covering positioning, pricing, MVP scope, and a concrete 48-hour first action step.",
                icon: Zap,
              },
              {
                title: "7. Executive Scorecard & Plan",
                desc: "Compiles a quantitative 1-10 venture viability scorecard and a step-by-step 7-day tactical roadmap.",
                icon: FileCheck,
              },
              {
                title: "Human-in-the-Loop Steering",
                desc: "You retain 100% control. Edit any output, regenerate weak sections, and approve each card before the next stage triggers.",
                icon: CheckCircle2,
              },
              {
                title: "Instant Clean Export",
                desc: "Export approved briefs directly to structured Markdown and presentation-ready PDF reports with full source citations.",
                icon: Sparkles,
              },
            ].map((f, idx) => {
              const Icon = f.icon;
              return (
                <div
                  key={idx}
                  className="rounded-2xl border border-border bg-card p-6 shadow-sm hover:border-primary/50 transition-all hover:shadow-md"
                >
                  <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-4">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="text-base font-bold text-foreground mb-1.5">{f.title}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">{f.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Bottom Banner */}
      <section className="w-full py-20 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto text-center">
        <div className="rounded-3xl bg-gradient-to-r from-primary to-indigo-600 text-white p-8 sm:p-12 shadow-2xl relative overflow-hidden">
          <div className="relative z-10">
            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
              Ready to validate your startup in 5 minutes?
            </h2>
            <p className="mt-3 text-sm sm:text-base text-white/90 max-w-xl mx-auto">
              Join founders using FounderFlow AI to de-risk their early-stage ventures before spending capital on development.
            </p>
            <div className="mt-8">
              <Link href="/new">
                <Button size="lg" className="bg-white text-primary hover:bg-white/90 shadow-lg font-bold px-8">
                  Start Free Research
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

