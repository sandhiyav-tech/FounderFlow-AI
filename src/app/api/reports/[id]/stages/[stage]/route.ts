import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { reportRepository } from "@/db";
import { STAGE_NAMES, type StageName, type StageStatus } from "@/types";

const PatchStageSchema = z.object({
  status: z.enum(["pending", "generating", "generated", "approved", "error"]).optional(),
  output: z.any().optional(),
  sources: z.array(z.any()).optional(),
  error: z.string().nullable().optional(),
  report: z.any().optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; stage: string }> }
) {
  try {
    const { id: reportId, stage } = await params;

    if (!STAGE_NAMES.includes(stage as StageName)) {
      return NextResponse.json(
        { success: false, error: `Invalid stage: ${stage}` },
        { status: 400 }
      );
    }

    const body = await req.json();
    const validated = PatchStageSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { success: false, error: "Validation failed", details: validated.error.format() },
        { status: 400 }
      );
    }

    const stageName = stage as StageName;

    // Check if report exists; if not and client passed fallback report, rehydrate
    let existingReport = await reportRepository.getReport(reportId);
    if (!existingReport && body?.report) {
      try {
        await reportRepository.createReport({
          id: body.report.id,
          userId: body.report.userId || "anon",
          idea: body.report.idea,
          industry: body.report.industry,
          region: body.report.region,
          budget: body.report.budget,
          initialStages: (body.report.stages || []).map((s: any) => ({
            id: s.id,
            name: s.name,
            orderIndex: s.orderIndex,
          })),
        });
      } catch {
        // ignore
      }
    }

    await reportRepository.updateStage({
      reportId,
      stageName,
      status: validated.data.status as StageStatus | undefined,
      output: validated.data.output,
      sources: validated.data.sources,
      error: validated.data.error,
    });

    // Check if all stages are now approved
    const report = await reportRepository.getReport(reportId) || body?.report;
    let reportStatus = report?.status || "in_review";

    if (report && report.stages) {
      const allApproved = report.stages.every((s: any) =>
        s.name === stageName ? validated.data.status === "approved" : s.status === "approved"
      );
      const currentStageObj = report.stages.find((s: any) => s.name === stageName);
      const stageIdx = currentStageObj ? currentStageObj.orderIndex : 0;

      if (allApproved) {
        reportStatus = "approved";
        await reportRepository.updateReportStatus({
          reportId,
          status: "approved",
          currentStageIndex: 6,
        });
      } else if (validated.data.status === "approved") {
        reportStatus = "in_review";
        await reportRepository.updateReportStatus({
          reportId,
          status: "in_review",
          currentStageIndex: Math.min(6, stageIdx + 1),
        });
      }
    }

    const updated = await reportRepository.getReport(reportId);
    const updatedStage = updated?.stages?.find((s) => s.name === stageName) || {
      id: `stage-${stageName}`,
      reportId,
      name: stageName,
      orderIndex: STAGE_NAMES.indexOf(stageName),
      status: validated.data.status || "approved",
      output: validated.data.output,
      sources: validated.data.sources || null,
      updatedAt: new Date().toISOString(),
    };

    return NextResponse.json({
      success: true,
      stage: updatedStage,
      reportStatus,
    });
  } catch (error: any) {
    console.error("[API] PATCH /api/reports/[id]/stages/[stage] error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update stage" },
      { status: 500 }
    );
  }
}
