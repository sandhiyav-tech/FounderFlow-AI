"use client";

import React from "react";
import { Check, Loader2, AlertCircle, Clock, Lightbulb, Users, Search, TrendingUp, MessageSquare, Compass, FileCheck } from "lucide-react";
import { STAGE_CONFIG, STAGE_NAMES, type StageName, type StageRecord } from "@/types";

const ICON_MAP: Record<string, React.ElementType> = {
  Lightbulb,
  Users,
  Search,
  TrendingUp,
  MessageSquare,
  Compass,
  FileCheck,
};

interface StageStepperProps {
  stages: StageRecord[];
  activeStage: StageName;
  onSelectStage: (stageName: StageName) => void;
}

export function StageStepper({ stages, activeStage, onSelectStage }: StageStepperProps) {
  const approvedCount = stages.filter((s) => s.status === "approved").length;
  const progressPercent = Math.round((approvedCount / STAGE_NAMES.length) * 100);

  return (
    <div className="w-full bg-card rounded-2xl border border-border p-4 sm:p-6 shadow-sm mb-8">
      {/* Top Header & Progress */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-border/60 gap-2">
        <div>
          <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
            Research Pipeline Progress
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Human-in-the-loop: Review, edit, and approve each stage to advance.
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <div className="text-right">
            <span className="text-xs font-semibold text-foreground">
              {approvedCount} of {STAGE_NAMES.length} Stages Approved
            </span>
          </div>
          <div className="w-24 sm:w-32 bg-muted rounded-full h-2.5 overflow-hidden">
            <div
              className="bg-primary h-2.5 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Stepper Node List */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 pt-4">
        {STAGE_NAMES.map((name, index) => {
          const config = STAGE_CONFIG[name];
          const stageRecord = stages.find((s) => s.name === name);
          const status = stageRecord?.status || "pending";
          const isActive = activeStage === name;
          const Icon = ICON_MAP[config.icon] || Lightbulb;

          let badgeBg = "bg-muted text-muted-foreground border-border";
          let statusText = "Pending";

          if (status === "approved") {
            badgeBg = "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30";
            statusText = "Approved";
          } else if (status === "generated") {
            badgeBg = "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30";
            statusText = "In Review";
          } else if (status === "generating") {
            badgeBg = "bg-primary/10 text-primary border-primary/30 animate-pulse";
            statusText = "Generating";
          } else if (status === "error") {
            badgeBg = "bg-rose-500/10 text-rose-600 border-rose-500/30";
            statusText = "Error";
          }

          return (
            <button
              key={name}
              onClick={() => onSelectStage(name)}
              className={`flex flex-col text-left p-3 rounded-xl border transition-all text-xs relative ${
                isActive
                  ? "border-primary shadow-sm bg-primary/5 ring-1 ring-primary/20"
                  : "border-border/60 hover:border-border hover:bg-muted/40"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-[11px] text-muted-foreground">
                  0{index + 1}
                </span>
                <span className={`inline-flex items-center justify-center w-5 h-5 rounded-full border ${badgeBg}`}>
                  {status === "approved" ? (
                    <Check className="w-3 h-3 text-emerald-600" />
                  ) : status === "generating" ? (
                    <Loader2 className="w-3 h-3 animate-spin text-primary" />
                  ) : status === "error" ? (
                    <AlertCircle className="w-3 h-3 text-rose-600" />
                  ) : (
                    <Clock className="w-3 h-3 text-muted-foreground" />
                  )}
                </span>
              </div>

              <div className="flex items-center space-x-1.5 font-semibold text-foreground truncate">
                <Icon className="w-3.5 h-3.5 shrink-0 text-primary" />
                <span className="truncate">{config.title}</span>
              </div>

              <span className="text-[10px] text-muted-foreground mt-1 capitalize font-medium">
                {statusText}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

