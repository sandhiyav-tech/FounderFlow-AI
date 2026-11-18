import { NextRequest, NextResponse } from "next/server";
import { runPipelineStage } from "@/lib/pipeline";
import { checkRateLimit } from "@/lib/rate-limiter";
import { STAGE_NAMES, type StageName } from "@/types";

// Vercel Serverless Function Execution Max Duration
export const maxDuration = 60;

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; stage: string }> }
) {
  try {
    const { id: reportId, stage } = await params;

    // Validate stage name
    if (!STAGE_NAMES.includes(stage as StageName)) {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid stage '${stage}'. Valid stages are: ${STAGE_NAMES.join(", ")}`,
        },
        { status: 400 }
      );
    }

    // Rate Limiting
    const forwarded = req.headers.get("x-forwarded-for");
    const ip = forwarded ? forwarded.split(",")[0].trim() : "127.0.0.1";
    const rateLimitCheck = checkRateLimit(`rate_limit_stage_run_${ip}`, 30, 60000);

    if (!rateLimitCheck.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Rate limit exceeded. Please wait a moment before running another stage.",
          retryAfterSeconds: rateLimitCheck.retryAfterSeconds,
        },
        {
          status: 429,
          headers: {
            "Retry-After": String(rateLimitCheck.retryAfterSeconds),
          },
        }
      );
    }

    // Parse fallback report if provided by client (vital for serverless statelessness without DB)
    let fallbackReport: any = undefined;
    try {
      const body = await req.json();
      if (body && body.report) {
        fallbackReport = body.report;
      }
    } catch {
      // Optional body
    }

    // Execute the stage pipeline
    const updatedStage = await runPipelineStage(reportId, stage as StageName, fallbackReport);

    return NextResponse.json({
      success: true,
      stage: updatedStage,
      message: `Stage '${stage}' executed successfully.`,
    });
  } catch (error: any) {
    console.error("[API] POST /api/reports/[id]/stages/[stage]/run error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to execute pipeline stage.",
        canRetry: true,
      },
      { status: 500 }
    );
  }
}
