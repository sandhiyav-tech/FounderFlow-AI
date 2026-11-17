import { NextRequest, NextResponse } from "next/server";
import { reportRepository } from "@/db";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const report = await reportRepository.getReport(id);

    if (!report) {
      return NextResponse.json(
        { success: false, error: "Report not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, report });
  } catch (error: any) {
    console.error("[API] GET /api/reports/[id] error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch report" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await reportRepository.deleteReport(id);
    return NextResponse.json({ success: true, message: "Report deleted successfully" });
  } catch (error: any) {
    console.error("[API] DELETE /api/reports/[id] error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to delete report" },
      { status: 500 }
    );
  }
}

