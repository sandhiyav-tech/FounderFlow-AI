import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import crypto from "crypto";
import { reportRepository } from "@/db";
import { getSessionUserId, SESSION_COOKIE_NAME } from "@/lib/session";
import { STAGE_NAMES } from "@/types";

const CreateReportSchema = z.object({
  idea: z.string().min(10, "Please describe your business idea in at least 10 characters."),
  industry: z.string().optional(),
  region: z.string().optional(),
  budget: z.string().optional(),
});

export async function GET(req: NextRequest) {
  try {
    const userId = await getSessionUserId();
    const reports = await reportRepository.listReports(userId);
    return NextResponse.json({ success: true, reports });
  } catch (error: any) {
    console.error("[API] GET /api/reports error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch reports." },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validated = CreateReportSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Validation failed",
          details: validated.error.format(),
        },
        { status: 400 }
      );
    }

    const userId = await getSessionUserId();
    const reportId = crypto.randomUUID();

    const initialStages = STAGE_NAMES.map((name, index) => ({
      id: crypto.randomUUID(),
      name,
      orderIndex: index,
    }));

    const newReport = await reportRepository.createReport({
      id: reportId,
      userId,
      idea: validated.data.idea,
      industry: validated.data.industry,
      region: validated.data.region,
      budget: validated.data.budget,
      initialStages,
    });

    const response = NextResponse.json(
      { success: true, report: newReport },
      { status: 201 }
    );

    // Ensure session cookie is set
    response.cookies.set(SESSION_COOKIE_NAME, userId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 365, // 1 year
      path: "/",
    });

    return response;
  } catch (error: any) {
    console.error("[API] POST /api/reports error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create report." },
      { status: 500 }
    );
  }
}

