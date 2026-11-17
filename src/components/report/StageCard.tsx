"use client";

import React, { useState } from "react";
import {
  Check,
  Edit3,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  AlertTriangle,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Target,
  DollarSign,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Button } from "../ui/Button";
import { Badge } from "../ui/Badge";
import { Modal } from "../ui/Modal";
import { CopyQuestionsButton } from "./CopyQuestionsButton";
import { STAGE_CONFIG, type StageName, type StageRecord, type SourceLink } from "@/types";

interface StageCardProps {
  stage: StageRecord;
  reportId: string;
  isCurrent: boolean;
  canRunNext: boolean;
  onApprove: (stageName: StageName) => Promise<void>;
  onRegenerate: (stageName: StageName) => Promise<void>;
  onSaveEdit: (stageName: StageName, updatedOutput: any) => Promise<void>;
  onRunStage?: (stageName: StageName) => Promise<void>;
}

export function StageCard({
  stage,
  reportId,
  isCurrent,
  canRunNext,
  onApprove,
  onRegenerate,
  onSaveEdit,
  onRunStage,
}: StageCardProps) {
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editJsonText, setEditJsonText] = useState("");
  const [editError, setEditError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);

  const config = STAGE_CONFIG[stage.name];
  const isApproved = stage.status === "approved";
  const isGenerated = stage.status === "generated";
  const isGenerating = stage.status === "generating";
  const isPending = stage.status === "pending";
  const isError = stage.status === "error";

  const handleOpenEdit = () => {
    setEditJsonText(JSON.stringify(stage.output, null, 2));
    setEditError(null);
    setIsEditOpen(true);
  };

  const handleSaveEdit = async () => {
    try {
      setEditError(null);
      setIsSaving(true);
      const parsed = JSON.parse(editJsonText);
      await onSaveEdit(stage.name, parsed);
      setIsEditOpen(false);
    } catch (err: any) {
      setEditError(err.message || "Invalid JSON syntax.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleApprove = async () => {
    setIsApproving(true);
    try {
      await onApprove(stage.name);
    } finally {
      setIsApproving(false);
    }
  };

  const handleRegenerate = async () => {
    setIsRegenerating(true);
    try {
      await onRegenerate(stage.name);
    } finally {
      setIsRegenerating(false);
    }
  };

  return (
    <div
      id={`stage-${stage.name}`}
      className={`rounded-2xl border transition-all mb-6 bg-card shadow-sm ${
        isCurrent
          ? "border-primary/60 ring-2 ring-primary/10 shadow-md"
          : isApproved
          ? "border-emerald-500/30 dark:border-emerald-500/20"
          : "border-border"
      }`}
    >
      {/* Card Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between p-5 border-b border-border/80 gap-3">
        <div className="flex items-center space-x-3">
          <div
            className={`flex items-center justify-center w-8 h-8 rounded-xl font-bold text-xs ${
              isApproved
                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
                : isCurrent
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground"
            }`}
          >
            {isApproved ? <Check className="w-4 h-4" /> : `0${config.order}`}
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="font-bold text-base text-foreground tracking-tight">
                {config.title}
              </h3>
              {isApproved && <Badge variant="success">Approved</Badge>}
              {isGenerated && <Badge variant="warning">Ready for Review</Badge>}
              {isGenerating && <Badge variant="default">Analyzing with AI...</Badge>}
              {isPending && <Badge variant="secondary">Pending</Badge>}
              {isError && <Badge variant="destructive">Needs Attention</Badge>}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">{config.shortDesc}</p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-2 self-end sm:self-auto">
          {stage.output && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={handleOpenEdit}
                disabled={isGenerating}
                className="space-x-1 text-xs"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Edit</span>
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={handleRegenerate}
                isLoading={isRegenerating || isGenerating}
                disabled={isGenerating}
                className="space-x-1 text-xs text-muted-foreground hover:text-foreground"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Regenerate</span>
              </Button>
            </>
          )}

          {isPending && onRunStage && (
            <Button
              variant="default"
              size="sm"
              onClick={() => onRunStage(stage.name)}
              isLoading={isGenerating}
              className="space-x-1.5 text-xs shadow-sm"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Run Stage</span>
            </Button>
          )}

          {stage.output && !isApproved && (
            <Button
              variant="success"
              size="sm"
              onClick={handleApprove}
              isLoading={isApproving}
              className="space-x-1.5 text-xs shadow-sm"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Approve & Continue</span>
            </Button>
          )}

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-muted-foreground h-8 w-8"
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </Button>
        </div>
      </div>

      {/* Card Content Body */}
      {isExpanded && (
        <div className="p-6">
          {/* AI Claim Label & Sources Banner */}
          {stage.output && (
            <div className="flex flex-wrap items-center justify-between gap-2 mb-6 pb-4 border-b border-border/50 text-xs">
              <div className="flex items-center space-x-1.5 text-primary dark:text-indigo-400 font-medium bg-primary/5 px-2.5 py-1 rounded-md">
                <Sparkles className="w-3.5 h-3.5" />
                <span>AI-Synthesized Hypothesis • Founder Approval Required</span>
              </div>
              <span className="text-muted-foreground italic text-[11px]">
                Verify before making capital commitments
              </span>
            </div>
          )}

          {/* Pending State */}
          {isPending && (
            <div className="text-center py-10 px-4">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-muted text-muted-foreground mb-3">
                <Target className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-semibold text-foreground">Stage Pending</h4>
              <p className="text-xs text-muted-foreground max-w-md mx-auto mt-1 mb-4">
                This stage will execute sequentially using outputs approved in earlier stages as verified context.
              </p>
              {onRunStage && (
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => onRunStage(stage.name)}
                  className="space-x-1.5 shadow-sm"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Start Stage Analysis Now</span>
                </Button>
              )}
            </div>
          )}

          {/* Generating Loading State */}
          {isGenerating && (
            <div className="text-center py-12 px-4">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-primary/10 text-primary mb-3 animate-bounce">
                <Sparkles className="w-6 h-6 animate-spin" />
              </div>
              <h4 className="text-sm font-semibold text-foreground">
                Analyzing & Synthesizing {config.title}...
              </h4>
              <p className="text-xs text-muted-foreground max-w-md mx-auto mt-1">
                Claude is synthesizing live market search signals and validating structured output.
              </p>
            </div>
          )}

          {/* Error State */}
          {isError && (
            <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-5 text-center my-4">
              <AlertTriangle className="w-6 h-6 text-rose-600 mx-auto mb-2" />
              <h4 className="text-sm font-semibold text-rose-700 dark:text-rose-300">
                Pipeline Stage Execution Interrupted
              </h4>
              <p className="text-xs text-rose-600/90 dark:text-rose-400 max-w-md mx-auto mt-1 mb-4">
                {stage.error || "An error occurred while generating this stage. Click retry to try again."}
              </p>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleRegenerate}
                className="space-x-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Retry Generation</span>
              </Button>
            </div>
          )}

          {/* Render Stage Specific Outputs */}
          {stage.output && renderStageContent(stage.name, stage.output, stage.sources)}
        </div>
      )}

      {/* Edit Modal */}
      <Modal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        title={`Edit ${config.title}`}
        description="Fine-tune and customize the research output. Your edits will be saved as approved context for downstream pipeline stages."
        maxWidth="2xl"
      >
        <div className="space-y-4">
          {editError && (
            <div className="p-3 text-xs bg-rose-500/10 border border-rose-500/30 text-rose-600 rounded-lg">
              {editError}
            </div>
          )}
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1 uppercase tracking-wider">
              Stage Output JSON
            </label>
            <textarea
              value={editJsonText}
              onChange={(e) => setEditJsonText(e.target.value)}
              className="w-full h-80 font-mono text-xs p-3 rounded-xl border border-input bg-muted/40 focus:bg-background focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div className="flex justify-end space-x-2 pt-2 border-t border-border">
            <Button variant="outline" size="sm" onClick={() => setIsEditOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={handleSaveEdit}
              isLoading={isSaving}
              className="space-x-1.5"
            >
              <Check className="w-4 h-4" />
              <span>Save & Apply Changes</span>
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

// =========================================================================
// STAGE-SPECIFIC BEAUTIFUL RENDERING FUNCTIONS
// =========================================================================

function renderStageContent(stageName: StageName, output: any, sources?: SourceLink[] | null) {
  switch (stageName) {
    case "idea_analysis":
      return renderIdeaAnalysis(output);
    case "target_audience":
      return renderTargetAudience(output);
    case "competitor_research":
      return renderCompetitorResearch(output, sources);
    case "market_opportunities":
      return renderMarketOpportunities(output, sources);
    case "customer_discovery_questions":
      return renderCustomerDiscovery(output);
    case "business_strategies":
      return renderBusinessStrategies(output);
    case "final_report":
      return renderFinalReport(output);
    default:
      return <pre className="text-xs font-mono">{JSON.stringify(output, null, 2)}</pre>;
  }
}

function renderIdeaAnalysis(data: any) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 rounded-xl bg-muted/30 border border-border">
          <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">
            Core Problem
          </span>
          <p className="text-sm text-foreground leading-relaxed">{data.problem}</p>
        </div>

        <div className="p-4 rounded-xl bg-muted/30 border border-border">
          <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">
            Proposed Solution
          </span>
          <p className="text-sm text-foreground leading-relaxed">{data.solution}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 rounded-xl bg-indigo-50/40 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/40">
          <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 block mb-1">
            Value Proposition Wedge
          </span>
          <p className="text-sm font-medium text-foreground">{data.valueProposition}</p>
        </div>

        <div className="p-4 rounded-xl bg-muted/30 border border-border">
          <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">
            Monetization & Business Model
          </span>
          <p className="text-sm text-foreground">{data.businessModel}</p>
        </div>
      </div>

      {/* Assumptions to Validate */}
      {data.coreAssumptions && data.coreAssumptions.length > 0 && (
        <div className="p-4 rounded-xl border border-amber-500/20 bg-amber-500/5">
          <div className="flex items-center space-x-2 mb-2">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300">
              Critical Assumptions to Validate
            </h4>
          </div>
          <ul className="space-y-1.5 text-xs text-foreground">
            {data.coreAssumptions.map((assump: string, idx: number) => (
              <li key={idx} className="flex items-start space-x-2">
                <span className="text-amber-500 font-bold">•</span>
                <span>{assump}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* SWOT Strengths & Weaknesses */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 block mb-2">
            Inherent Strengths & Moats
          </span>
          <ul className="space-y-1 text-xs text-foreground">
            {(data.strengths || []).map((s: string, idx: number) => (
              <li key={idx} className="flex items-center space-x-1.5">
                <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>{s}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="p-4 rounded-xl border border-rose-500/20 bg-rose-500/5">
          <span className="text-xs font-bold uppercase tracking-wider text-rose-700 dark:text-rose-400 block mb-2">
            Weaknesses & Vulnerabilities
          </span>
          <ul className="space-y-1 text-xs text-foreground">
            {(data.weaknesses || []).map((w: string, idx: number) => (
              <li key={idx} className="flex items-center space-x-1.5">
                <span className="text-rose-500 font-bold">⚠️</span>
                <span>{w}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

function renderTargetAudience(data: any) {
  return (
    <div className="space-y-6">
      {/* Beachhead Highlight */}
      <div className="p-4 rounded-xl bg-gradient-to-r from-primary/10 via-indigo-500/5 to-purple-500/10 border border-primary/20">
        <div className="flex items-center space-x-2 text-primary font-bold text-xs uppercase tracking-wider mb-1">
          <Target className="w-4 h-4" />
          <span>Recommended Primary Beachhead</span>
        </div>
        <p className="text-sm font-semibold text-foreground">{data.primaryBeachhead}</p>
        <p className="text-xs text-muted-foreground mt-2">
          <strong>Ideal Persona:</strong> {data.recommendedPersona}
        </p>
      </div>

      {/* Segments Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {(data.segments || []).map((seg: any, idx: number) => (
          <div key={idx} className="p-4 rounded-xl border border-border bg-card flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-primary">Segment 0{idx + 1}</span>
              </div>
              <h4 className="font-bold text-sm text-foreground mb-1">{seg.name}</h4>
              <p className="text-xs text-muted-foreground mb-3">{seg.demographics}</p>

              <div className="space-y-2 mb-3">
                <div>
                  <span className="text-[10px] font-bold uppercase text-muted-foreground block">
                    Burning Pain Points
                  </span>
                  <ul className="text-xs text-foreground space-y-0.5">
                    {(seg.painPoints || []).map((p: string, pIdx: number) => (
                      <li key={pIdx}>• {p}</li>
                    ))}
                  </ul>
                </div>

                <div>
                  <span className="text-[10px] font-bold uppercase text-muted-foreground block">
                    Where To Reach Them
                  </span>
                  <ul className="text-xs text-muted-foreground space-y-0.5">
                    {(seg.whereToReachThem || []).map((w: string, wIdx: number) => (
                      <li key={wIdx}>📍 {w}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-border/50 text-[11px] text-indigo-600 dark:text-indigo-400">
              <strong>Early Adopter Signal:</strong> {seg.earlyAdopterSignal}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function renderCompetitorResearch(data: any, sources?: SourceLink[] | null) {
  const mergedSources = sources || data.sources || [];

  return (
    <div className="space-y-6">
      <div className="p-4 rounded-xl bg-muted/30 border border-border text-sm">
        <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-1">
          Market Landscape Summary
        </span>
        <p className="text-foreground">{data.marketLandscape}</p>
      </div>

      {/* Competitors List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {(data.competitors || []).map((comp: any, idx: number) => (
          <div key={idx} className="p-4 rounded-xl border border-border bg-card flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-1">
                <a
                  href={comp.url}
                  target="_blank"
                  rel="noreferrer"
                  className="font-bold text-sm text-primary hover:underline inline-flex items-center space-x-1"
                >
                  <span>{comp.name}</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
                <span className="text-[11px] font-semibold text-muted-foreground px-2 py-0.5 bg-muted rounded-md">
                  {comp.pricing}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mb-3">{comp.description}</p>

              <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                <div className="p-2 rounded-lg bg-emerald-500/5 border border-emerald-500/20">
                  <span className="text-[10px] font-bold text-emerald-600 block mb-0.5">Strengths</span>
                  <p className="text-[11px] text-foreground">{(comp.strengths || []).join(", ")}</p>
                </div>
                <div className="p-2 rounded-lg bg-rose-500/5 border border-rose-500/20">
                  <span className="text-[10px] font-bold text-rose-600 block mb-0.5">Weaknesses</span>
                  <p className="text-[11px] text-foreground">{(comp.weaknesses || []).join(", ")}</p>
                </div>
              </div>
            </div>

            <div className="p-2.5 rounded-lg bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/40 text-xs">
              <span className="font-bold text-indigo-700 dark:text-indigo-300 block text-[10px] uppercase">
                Differentiation Wedge
              </span>
              <p className="text-foreground mt-0.5">{comp.differentiationGap}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Defensibility */}
      {data.defensibilityStrategy && (
        <div className="p-4 rounded-xl border border-border bg-muted/20">
          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-1">
            Enduring Moat Strategy
          </span>
          <p className="text-xs text-foreground">{data.defensibilityStrategy}</p>
        </div>
      )}

      {/* Verified Sources & Citations */}
      {mergedSources.length > 0 && (
        <div className="pt-2">
          <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 flex items-center space-x-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>Verified Web Search Citations & Evidence</span>
          </h4>
          <div className="flex flex-wrap gap-2">
            {mergedSources.map((src: SourceLink, idx: number) => (
              <a
                key={idx}
                href={src.url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-border bg-muted/40 hover:bg-muted text-xs text-foreground transition-colors"
              >
                <span className="truncate max-w-[200px]">{src.title}</span>
                <ExternalLink className="w-3 h-3 text-muted-foreground shrink-0" />
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function renderMarketOpportunities(data: any, sources?: SourceLink[] | null) {
  return (
    <div className="space-y-6">
      {/* Sizing Signals */}
      {data.marketSizeSignals && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="p-3.5 rounded-xl border border-border bg-card">
            <span className="text-[10px] font-bold uppercase text-muted-foreground block">TAM Signal</span>
            <p className="text-xs font-semibold text-foreground mt-1">{data.marketSizeSignals.tamSignals}</p>
          </div>
          <div className="p-3.5 rounded-xl border border-border bg-card">
            <span className="text-[10px] font-bold uppercase text-muted-foreground block">SAM Estimate</span>
            <p className="text-xs font-semibold text-foreground mt-1">{data.marketSizeSignals.samSignals}</p>
          </div>
          <div className="p-3.5 rounded-xl border border-border bg-card">
            <span className="text-[10px] font-bold uppercase text-muted-foreground block">SOM Horizon</span>
            <p className="text-xs font-semibold text-foreground mt-1">{data.marketSizeSignals.somSignals}</p>
          </div>
          <div className="p-3.5 rounded-xl border border-border bg-card">
            <span className="text-[10px] font-bold uppercase text-muted-foreground block">Growth Driver</span>
            <p className="text-xs font-semibold text-foreground mt-1">{data.marketSizeSignals.growthRateOrDriver}</p>
          </div>
        </div>
      )}

      {/* Trends & Underserved Niches */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 rounded-xl border border-border bg-card">
          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-2">
            Macro & Industry Trends
          </span>
          <ul className="space-y-1.5 text-xs text-foreground">
            {(data.trends || []).map((t: string, idx: number) => (
              <li key={idx} className="flex items-start space-x-2">
                <TrendingUp className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                <span>{t}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="p-4 rounded-xl border border-border bg-card">
          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-2">
            Overlooked & Underserved Niches
          </span>
          <ul className="space-y-1.5 text-xs text-foreground">
            {(data.underservedNiches || []).map((n: string, idx: number) => (
              <li key={idx} className="flex items-start space-x-2">
                <Target className="w-3.5 h-3.5 text-indigo-500 shrink-0 mt-0.5" />
                <span>{n}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Risks with Severity Badges */}
      {data.risks && data.risks.length > 0 && (
        <div className="p-4 rounded-xl border border-border bg-muted/20">
          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-3">
            Critical Market Risks & Concrete Mitigations
          </span>
          <div className="space-y-2.5">
            {data.risks.map((r: any, idx: number) => (
              <div key={idx} className="p-3 rounded-lg border border-border bg-card flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                <div>
                  <div className="flex items-center space-x-2">
                    <Badge
                      variant={
                        r.severity === "high"
                          ? "destructive"
                          : r.severity === "medium"
                          ? "warning"
                          : "default"
                      }
                    >
                      {r.severity}
                    </Badge>
                    <span className="font-semibold text-foreground">{r.risk}</span>
                  </div>
                  <p className="text-muted-foreground mt-1 text-[11px]">
                    <strong>Mitigation:</strong> {r.mitigation}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function renderCustomerDiscovery(data: any) {
  return (
    <div className="space-y-6">
      {/* Top Banner with Copy Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/20 gap-3">
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-300">
            The Mom Test Interview Framework
          </h4>
          <p className="text-xs text-muted-foreground mt-0.5">
            10-15 non-leading questions focusing strictly on past customer behavior and wallet spend.
          </p>
        </div>
        <CopyQuestionsButton discoveryData={data} />
      </div>

      {/* Questions by Theme */}
      <div className="space-y-4">
        {(data.themes || []).map((theme: any, tIdx: number) => (
          <div key={tIdx} className="p-4 rounded-xl border border-border bg-card">
            <div className="mb-3">
              <h4 className="font-bold text-sm text-foreground">{theme.theme}</h4>
              <p className="text-xs text-muted-foreground">{theme.description}</p>
            </div>

            <div className="space-y-3">
              {(theme.questions || []).map((q: any, qIdx: number) => (
                <div key={qIdx} className="p-3 rounded-lg bg-muted/40 border border-border/60 text-xs">
                  <p className="font-semibold text-foreground text-[13px] mb-1">
                    "{q.question}"
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-muted-foreground mt-1.5 pt-1.5 border-t border-border/40">
                    <div>
                      <strong>Hypothesis Tested:</strong> {q.purpose}
                    </div>
                    <div>
                      <strong>Follow-up Probe:</strong> {q.followUpHint}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Interview Rules */}
      {data.interviewTips && (
        <div className="p-3.5 rounded-xl border border-border bg-muted/20 text-xs">
          <span className="font-bold text-muted-foreground uppercase text-[10px] block mb-1">
            Golden Rules of Discovery Interviews
          </span>
          <ul className="space-y-1 text-muted-foreground">
            {data.interviewTips.map((tip: string, idx: number) => (
              <li key={idx}>• {tip}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function renderBusinessStrategies(data: any) {
  const recIndex = data.recommendedStrategyIndex ?? 0;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {(data.strategies || []).map((strat: any, idx: number) => {
          const isRec = idx === recIndex;
          return (
            <div
              key={idx}
              className={`p-5 rounded-2xl border flex flex-col justify-between transition-all ${
                isRec
                  ? "border-primary bg-primary/5 shadow-md ring-1 ring-primary/20"
                  : "border-border bg-card"
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold text-muted-foreground">Option 0{idx + 1}</span>
                  {isRec && <Badge variant="purple">⭐ Recommended</Badge>}
                </div>
                <h4 className="font-bold text-base text-foreground mb-1">{strat.title}</h4>
                <p className="text-xs text-muted-foreground mb-4">{strat.positioning}</p>

                <div className="space-y-2.5 text-xs mb-4">
                  <div>
                    <span className="text-[10px] font-bold uppercase text-muted-foreground block">
                      Go-To-Market
                    </span>
                    <p className="text-foreground">{strat.goToMarket}</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase text-muted-foreground block">
                      Pricing Model
                    </span>
                    <p className="text-foreground">{strat.pricingModel}</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase text-muted-foreground block">
                      Day-1 MVP Scope
                    </span>
                    <ul className="text-muted-foreground space-y-0.5">
                      {(strat.mvpScope || []).map((m: string, mIdx: number) => (
                        <li key={mIdx}>• {m}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-border/60">
                <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-800 dark:text-emerald-300 mb-2">
                  <strong>First 48-Hour Step:</strong> {strat.firstStep}
                </div>
                <span className="text-[11px] text-muted-foreground block text-right">
                  Timeline: {strat.timelineEstimate}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {data.decisionCriteria && (
        <div className="p-4 rounded-xl border border-border bg-muted/20 text-xs">
          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-1">
            Founder Decision Matrix
          </span>
          <ul className="space-y-1 text-muted-foreground">
            {data.decisionCriteria.map((c: string, idx: number) => (
              <li key={idx}>• {c}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function renderFinalReport(data: any) {
  return (
    <div className="space-y-6">
      {/* Executive Summary */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-primary/10 via-indigo-500/5 to-purple-500/10 border border-primary/20">
        <h4 className="text-xs font-bold uppercase tracking-wider text-primary mb-2">
          Executive Venture Synthesis
        </h4>
        <p className="text-sm text-foreground leading-relaxed font-medium">
          {data.executiveSummary}
        </p>
      </div>

      {/* Viability Scorecard */}
      {data.ventureScorecard && (
        <div className="p-5 rounded-2xl border border-border bg-card">
          <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-4">
            Venture Viability Scorecard
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-3">
            {[
              { label: "Market Attractiveness", score: data.ventureScorecard.marketAttractiveness },
              { label: "Solution Feasibility", score: data.ventureScorecard.solutionFeasibility },
              { label: "Competitive Moat", score: data.ventureScorecard.competitiveMoat },
              { label: "Overall Viability", score: data.ventureScorecard.overallViability, isComposite: true },
            ].map((metric, idx) => (
              <div key={idx} className="p-3 rounded-xl bg-muted/40 border border-border/60">
                <span className="text-[10px] font-bold uppercase text-muted-foreground block truncate">
                  {metric.label}
                </span>
                <div className="flex items-baseline space-x-1 mt-1">
                  <span className={`text-2xl font-black ${metric.isComposite ? "text-primary" : "text-foreground"}`}>
                    {metric.score}
                  </span>
                  <span className="text-xs text-muted-foreground font-semibold">/ 10</span>
                </div>
                <div className="w-full bg-muted rounded-full h-1.5 mt-2 overflow-hidden">
                  <div
                    className={`h-1.5 rounded-full ${metric.isComposite ? "bg-primary" : "bg-indigo-500"}`}
                    style={{ width: `${(metric.score / 10) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground italic">
            <strong>Rationale:</strong> {data.ventureScorecard.rationale}
          </p>
        </div>
      )}

      {/* Key Findings */}
      {data.keyFindings && (
        <div className="p-4 rounded-xl border border-border bg-card">
          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-2">
            Top 5 Key Findings
          </span>
          <ul className="space-y-1.5 text-xs text-foreground">
            {data.keyFindings.map((kf: string, idx: number) => (
              <li key={idx} className="flex items-start space-x-2">
                <span className="text-primary font-bold">{idx + 1}.</span>
                <span>{kf}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Immediate 7-Day Action Plan */}
      {data.immediate7DayActionPlan && (
        <div className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300 block mb-3">
            Immediate 7-Day Tactical Execution Roadmap
          </span>
          <div className="space-y-2">
            {data.immediate7DayActionPlan.map((step: any, idx: number) => (
              <div key={idx} className="p-3 rounded-lg border border-border bg-card flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs">
                <div>
                  <span className="font-bold text-primary mr-2">{step.day}:</span>
                  <span className="text-foreground">{step.action}</span>
                </div>
                <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                  Target Outcome: {step.outcome}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

