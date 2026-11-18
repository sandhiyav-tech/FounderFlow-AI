"use client";

import React, { useState } from "react";
import { Download, FileText, Printer, Lock, CheckCircle2 } from "lucide-react";
import { Button } from "../ui/Button";
import type { ReportRecord } from "@/types";

interface ExportMenuProps {
  report: ReportRecord;
  onApproveAll?: () => void;
  isApproveAllLoading?: boolean;
}

export function ExportMenu({ report, onApproveAll, isApproveAllLoading }: ExportMenuProps) {
  const isApproved = report.status === "approved";
  const [downloading, setDownloading] = useState(false);

  const handleExportMarkdown = async () => {
    setDownloading(true);
    try {
      let res = await fetch(`/api/reports/${report.id}/export?format=md${isApproved ? "" : "&force=true"}`);
      if (!res.ok) {
        res = await fetch(`/api/reports/${report.id}/export?format=md${isApproved ? "" : "&force=true"}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ report }),
        });
      }
      if (!res.ok) {
        const errorData = await res.json();
        alert(errorData.error || "Failed to export report.");
        return;
      }
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `founderflow-report-${report.id.slice(0, 8)}.md`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error("Export error:", err);
    } finally {
      setDownloading(false);
    }
  };

  const handleExportPdf = () => {
    window.open(`/api/reports/${report.id}/export?format=pdf${isApproved ? "" : "&force=true"}`, "_blank");
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      {onApproveAll && !isApproved && (
        <Button
          variant="secondary"
          size="sm"
          onClick={onApproveAll}
          isLoading={isApproveAllLoading}
          className="space-x-1.5 border border-indigo-200 dark:border-indigo-900/60 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100"
        >
          <CheckCircle2 className="w-4 h-4 text-indigo-500" />
          <span>Approve All Stages</span>
        </Button>
      )}

      <Button
        variant="outline"
        size="sm"
        onClick={handleExportMarkdown}
        isLoading={downloading}
        className="space-x-1.5"
      >
        <FileText className="w-4 h-4 text-muted-foreground" />
        <span>Export .MD</span>
        {!isApproved && <span className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold">(Draft)</span>}
      </Button>

      <Button
        variant="outline"
        size="sm"
        onClick={handleExportPdf}
        className="space-x-1.5"
      >
        <Printer className="w-4 h-4 text-muted-foreground" />
        <span>Export PDF / Print</span>
        {!isApproved && <span className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold">(Draft)</span>}
      </Button>
    </div>
  );
}

