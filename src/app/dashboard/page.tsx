"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  PlusCircle,
  Clock,
  CheckCircle2,
  AlertCircle,
  Trash2,
  ArrowRight,
  Search,
  Sparkles,
  FileText,
  Filter,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { Skeleton } from "@/components/ui/Skeleton";
import { formatDate, truncate } from "@/lib/utils";
import type { ReportRecord } from "@/types";

export default function DashboardPage() {
  const [reports, setReports] = useState<ReportRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const fetchReports = async () => {
    try {
      const res = await fetch("/api/reports");
      const data = await res.json();
      if (data.success) {
        setReports(data.reports || []);
      } else {
        throw new Error(data.error || "Failed to load reports");
      }
    } catch (err: any) {
      setError(err.message || "Failed to load reports.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this research brief?")) return;

    try {
      const res = await fetch(`/api/reports/${id}`, { method: "DELETE" });
      if (res.ok) {
        setReports((prev) => prev.filter((r) => r.id !== id));
      } else {
        alert("Failed to delete report.");
      }
    } catch (err) {
      console.error("Delete error:", err);
    }
  };

  const filteredReports = reports.filter((r) => {
    const matchesSearch =
      r.idea.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.industry && r.industry.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus =
      statusFilter === "all" || r.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-8 border-b border-border gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-foreground tracking-tight">
            Research Briefs Dashboard
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Track, review, and export all your validated startup hypotheses.
          </p>
        </div>

        <Link href="/new">
          <Button className="space-x-1.5 shadow-sm">
            <PlusCircle className="w-4 h-4" />
            <span>Validate New Idea</span>
          </Button>
        </Link>
      </div>

      {/* Filter and Search Bar */}
      <div className="my-6 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search ideas or industries..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 text-xs"
          />
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <span className="text-xs text-muted-foreground font-semibold flex items-center space-x-1">
            <Filter className="w-3.5 h-3.5" />
            <span>Status:</span>
          </span>
          {["all", "draft", "in_review", "approved"].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all border ${
                statusFilter === st
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background border-border text-muted-foreground hover:bg-muted"
              }`}
            >
              {st.replace("_", " ")}
            </button>
          ))}
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-28 w-full rounded-2xl" />
          ))}
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="p-4 rounded-xl border border-rose-500/20 bg-rose-500/10 text-rose-600 text-sm">
          {error}
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && reports.length === 0 && (
        <div className="text-center py-20 px-4 rounded-3xl border border-border bg-card">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-bold text-foreground">No Research Briefs Yet</h3>
          <p className="text-xs text-muted-foreground max-w-md mx-auto mt-1 mb-6">
            Enter your first startup idea to experience 7-stage autonomous market validation.
          </p>
          <Link href="/new">
            <Button className="space-x-1.5">
              <PlusCircle className="w-4 h-4" />
              <span>Validate First Startup Idea</span>
            </Button>
          </Link>
        </div>
      )}

      {/* No Search Matches */}
      {!loading && !error && reports.length > 0 && filteredReports.length === 0 && (
        <div className="text-center py-12 text-sm text-muted-foreground">
          No research briefs match "{searchQuery}".
        </div>
      )}

      {/* Reports List */}
      <div className="grid grid-cols-1 gap-4">
        {filteredReports.map((report) => {
          const approvedStages = (report.stages || []).filter((s) => s.status === "approved").length;
          const isFullyApproved = report.status === "approved";

          return (
            <Link
              key={report.id}
              href={`/report/${report.id}`}
              className="group block p-5 rounded-2xl border border-border bg-card hover:border-primary/50 transition-all hover:shadow-md"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-2 flex-1">
                  <div className="flex items-center space-x-2">
                    <Badge
                      variant={
                        isFullyApproved
                          ? "success"
                          : report.status === "in_review"
                          ? "warning"
                          : "secondary"
                      }
                    >
                      {report.status.replace("_", " ").toUpperCase()}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      Created {formatDate(report.createdAt)}
                    </span>
                    {report.industry && (
                      <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-md font-medium">
                        {report.industry}
                      </span>
                    )}
                  </div>

                  <h3 className="text-base font-bold text-foreground group-hover:text-primary transition-colors line-clamp-2">
                    {report.idea}
                  </h3>

                  <div className="flex items-center space-x-4 text-xs text-muted-foreground pt-1">
                    <span>
                      <strong>Progress:</strong> {approvedStages} / 7 stages approved
                    </span>
                    {report.region && <span>&bull; {report.region}</span>}
                  </div>
                </div>

                {/* Right Actions */}
                <div className="flex items-center space-x-3 self-end sm:self-auto shrink-0">
                  <button
                    onClick={(e) => handleDelete(e, report.id)}
                    className="p-2 rounded-lg text-muted-foreground hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                    title="Delete Brief"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                  <div className="inline-flex items-center space-x-1 text-xs font-semibold text-primary group-hover:translate-x-0.5 transition-transform">
                    <span>Open Brief</span>
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

