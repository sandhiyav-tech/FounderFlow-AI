import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { reportRepository } from "@/db";
import { STAGE_NAMES, type StageName, type StageStatus } from "@/types";

const PatchStageSchema = z.object({
  status: z.enum(["pending", "generating", "generated", "approved", "error"]).optional(),
  output: z.any().optional(),
  sources: z.array(z.any()).optional(),
  error: z.string().nullable().optional(),
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

    await reportRepository.updateStage({
      reportId,
      stageName,
      status: validated.data.status as StageStatus | undefined,
      output: validated.data.output,
      sources: validated.data.sources,
      error: validated.data.error,
    });

    // Check if all stages are now approved
    const report = await reportRepository.getReport(reportId);
    if (report && report.stages) {
      const allApproved = report.stages.every((s) => s.status === "approved");
      const currentStageObj = report.stages.find((s) => s.name === stageName);
      const stageIdx = currentStageObj ? currentStageObj.orderIndex : 0;

      if (allApproved) {
        await reportRepository.updateReportStatus({
          reportId,
          status: "approved",
          currentStageIndex: 6,
        });
      } else if (validated.data.status === "approved") {
        await reportRepository.updateReportStatus({
          reportId,
          status: "in_review",
          currentStageIndex: Math.min(6, stageIdx + 1),
        });
      }
    }

    const updated = await reportRepository.getReport(reportId);
    const updatedStage = updated?.stages?.find((s) => s.name === stageName);

    return NextResponse.json({
      success: true,
      stage: updatedStage,
      reportStatus: updated?.status,
    });
  } catch (error: any) {
    console.error("[API] PATCH /api/reports/[id]/stages/[stage] error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update stage" },
      { status: 500 }
    );
  }
}

