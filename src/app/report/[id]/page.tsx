"use client";

import React, { useEffect, useState, useCallback, use } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Play,
  RotateCcw,
  Clock,
  Share2,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { StageStepper } from "@/components/report/StageStepper";
import { StageCard } from "@/components/report/StageCard";
import { ExportMenu } from "@/components/report/ExportMenu";
import { STAGE_NAMES, type StageName, type ReportRecord, type StageRecord } from "@/types";

export default function ReportWorkspacePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const reportId = resolvedParams.id;

  const [report, setReport] = useState<ReportRecord | null>(null);
  const [activeStage, setActiveStage] = useState<StageName>("idea_analysis");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isApproveAllLoading, setIsApproveAllLoading] = useState(false);

  // Fetch report data
  const fetchReport = useCallback(async () => {
    try {
      const res = await fetch(`/api/reports/${reportId}`);
      if (!res.ok) {
        throw new Error("Failed to load research report.");
      }
      const data = await res.json();
      if (data.success && data.report) {
        setReport(data.report);

        // Find active stage if not yet selected
        const stages: StageRecord[] = data.report.stages || [];
        const firstUnapproved = stages.find((s) => s.status !== "approved");
        if (firstUnapproved) {
          setActiveStage(firstUnapproved.name);
        }
      }
    } catch (err: any) {
      setError(err.message || "An error occurred.");
    } finally {
      setLoading(false);
    }
  }, [reportId]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  // Run a specific stage
  const handleRunStage = async (stageName: StageName) => {
    if (!report) return;

    // Set local state to generating immediately for instant UI feedback
    setReport((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        stages: (prev.stages || []).map((s) =>
          s.name === stageName ? { ...s, status: "generating", error: null } : s
        ),
      };
    });

    try {
      const res = await fetch(`/api/reports/${report.id}/stages/${stageName}/run`, {
        method: "POST",
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || `Failed to run stage ${stageName}`);
      }

      // Update report with the newly generated stage
      setReport((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          status: "in_review",
          stages: (prev.stages || []).map((s) =>
            s.name === stageName ? data.stage : s
          ),
        };
      });
    } catch (err: any) {
      setReport((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          stages: (prev.stages || []).map((s) =>
            s.name === stageName ? { ...s, status: "error", error: err.message } : s
          ),
        };
      });
    }
  };

  // Auto-run Stage 1 if newly created
  useEffect(() => {
    if (report && report.stages) {
      const stage1 = report.stages.find((s) => s.name === "idea_analysis");
      if (stage1 && stage1.status === "pending") {
        handleRunStage("idea_analysis");
      }
    }
  }, [report?.id]);

  // Save manual edits to a stage
  const handleSaveEdit = async (stageName: StageName, updatedOutput: any) => {
    if (!report) return;

    try {
      const res = await fetch(`/api/reports/${report.id}/stages/${stageName}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ output: updatedOutput }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to save edits.");
      }

      setReport((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          stages: (prev.stages || []).map((s) =>
            s.name === stageName ? data.stage : s
          ),
        };
      });
    } catch (err: any) {
      alert(`Error saving edit: ${err.message}`);
    }
  };

  // Approve a stage and trigger the next one
  const handleApprove = async (stageName: StageName) => {
    if (!report) return;

    try {
      const res = await fetch(`/api/reports/${report.id}/stages/${stageName}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "approved" }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to approve stage.");
      }

      // Update state
      let nextStageName: StageName | null = null;
      setReport((prev) => {
        if (!prev) return prev;
        const currentIdx = STAGE_NAMES.indexOf(stageName);
        if (currentIdx < STAGE_NAMES.length - 1) {
          nextStageName = STAGE_NAMES[currentIdx + 1];
        }

        return {
          ...prev,
          status: data.reportStatus || prev.status,
          stages: (prev.stages || []).map((s) =>
            s.name === stageName ? { ...s, status: "approved" } : s
          ),
        };
      });

      // Advance active stage
      if (nextStageName) {
        setActiveStage(nextStageName);

        // Auto-run next stage if it was pending
        const nextStageObj = report.stages?.find((s) => s.name === nextStageName);
        if (nextStageObj && nextStageObj.status === "pending") {
          await handleRunStage(nextStageName);
        }
      }
    } catch (err: any) {
      alert(`Approval error: ${err.message}`);
    }
  };

  // Regenerate stage
  const handleRegenerate = async (stageName: StageName) => {
    await handleRunStage(stageName);
  };

  // "Approve All" action
  const handleApproveAll = async () => {
    if (!report) return;
    setIsApproveAllLoading(true);

    try {
      // Run and approve each stage in sequence
      for (const stageName of STAGE_NAMES) {
        let currentStage = report.stages?.find((s) => s.name === stageName);

        if (!currentStage || currentStage.status === "pending" || currentStage.status === "error") {
          await handleRunStage(stageName);
        }

        await fetch(`/api/reports/${report.id}/stages/${stageName}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "approved" }),
        });
      }

      // Refresh final report state
      await fetchReport();
    } catch (err: any) {
      console.error("Approve all error:", err);
      alert(`Failed to complete all stages: ${err.message}`);
    } finally {
      setIsApproveAllLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-12 space-y-6">
        <Skeleton className="h-8 w-48 rounded-lg" />
        <Skeleton className="h-32 w-full rounded-2xl" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-foreground">Report Not Found</h2>
        <p className="text-sm text-muted-foreground mt-1 mb-6">
          {error || "The requested research report could not be located."}
        </p>
        <Link href="/new">
          <Button>Submit New Business Idea</Button>
        </Link>
      </div>
    );
  }

  const isApproved = report.status === "approved";
  const stagesList = report.stages || [];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      {/* Top Breadcrumb & Metadata */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-border gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs text-muted-foreground mb-2">
            <Link href="/dashboard" className="hover:text-foreground transition-colors flex items-center space-x-1">
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Dashboard</span>
            </Link>
            <span>/</span>
            <span className="font-mono">{report.id.slice(0, 8)}</span>
          </div>

          <div className="flex items-center space-x-3">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
              Research Workspace
            </h1>
            <Badge
              variant={
                isApproved ? "success" : report.status === "in_review" ? "warning" : "secondary"
              }
            >
              {report.status.replace("_", " ").toUpperCase()}
            </Badge>
          </div>
        </div>

        {/* Export and Actions Bar */}
        <ExportMenu
          report={report}
          onApproveAll={!isApproved ? handleApproveAll : undefined}
          isApproveAllLoading={isApproveAllLoading}
        />
      </div>

      {/* Idea Context Summary Banner */}
      <div className="my-6 p-5 rounded-2xl border border-border bg-card/60 backdrop-blur-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="max-w-3xl">
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">
            Startup Thesis Under Evaluation
          </span>
          <p className="text-sm font-semibold text-foreground leading-relaxed">
            "{report.idea}"
          </p>
          <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-muted-foreground">
            {report.industry && <span><strong>Industry:</strong> {report.industry}</span>}
            {report.region && <span>&bull; <strong>Region:</strong> {report.region}</span>}
            {report.budget && <span>&bull; <strong>Budget:</strong> {report.budget}</span>}
          </div>
        </div>

        <div className="shrink-0 flex items-center space-x-2">
          <div className="p-2.5 rounded-xl bg-primary/5 border border-primary/20 text-xs text-primary flex items-center space-x-1.5">
            <Sparkles className="w-4 h-4" />
            <span className="font-medium">Claude 3.5 Sonnet + Tavily Web</span>
          </div>
        </div>
      </div>

      {/* Stage Stepper Navigation */}
      <StageStepper
        stages={stagesList}
        activeStage={activeStage}
        onSelectStage={(name) => {
          setActiveStage(name);
          const el = document.getElementById(`stage-${name}`);
          if (el) el.scrollIntoView({ behavior: "smooth" });
        }}
      />

      {/* All 7 Stages Rendered Sequentially */}
      <div className="space-y-6">
        {STAGE_NAMES.map((name, idx) => {
          const stageRecord = stagesList.find((s) => s.name === name) || {
            id: `temp-${name}`,
            reportId: report.id,
            name,
            orderIndex: idx,
            status: "pending",
            output: null,
            sources: null,
            updatedAt: new Date().toISOString(),
          };

          return (
            <StageCard
              key={name}
              stage={stageRecord as StageRecord}
              reportId={report.id}
              isCurrent={activeStage === name}
              canRunNext={idx === 0 || stagesList[idx - 1]?.status === "approved"}
              onApprove={handleApprove}
              onRegenerate={handleRegenerate}
              onSaveEdit={handleSaveEdit}
              onRunStage={handleRunStage}
            />
          );
        })}
      </div>

      {/* Bottom Completion Banner */}
      {isApproved && (
        <div className="mt-10 p-6 rounded-3xl bg-gradient-to-r from-emerald-500/10 via-emerald-500/5 to-teal-500/10 border border-emerald-500/30 text-center">
          <CheckCircle2 className="w-10 h-10 text-emerald-600 dark:text-emerald-400 mx-auto mb-2" />
          <h3 className="text-lg font-bold text-foreground">
            All 7 Stages Approved! Report Ready for Action
          </h3>
          <p className="text-xs text-muted-foreground max-w-lg mx-auto mt-1 mb-4">
            Your intelligence brief is fully validated. Export to Markdown or PDF to share with co-founders and investors.
          </p>
          <ExportMenu report={report} />
        </div>
      )}
    </div>
  );
}

