import { NextRequest, NextResponse } from "next/server";
import { reportRepository } from "@/db";
import { generateMarkdownReport, generatePrintableHtml } from "@/lib/export";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const format = searchParams.get("format") || "md";
    const force = searchParams.get("force") === "true";

    const report = await reportRepository.getReport(id);

    if (!report) {
      return NextResponse.json(
        { success: false, error: "Report not found" },
        { status: 404 }
      );
    }

    // Check approval requirement
    if (report.status !== "approved" && !force) {
      return NextResponse.json(
        {
          success: false,
          error: "Only approved reports can be exported. Please complete and approve all stages before exporting.",
          reportStatus: report.status,
        },
        { status: 403 }
      );
    }

    if (format === "pdf" || format === "html") {
      const html = generatePrintableHtml(report);
      return new NextResponse(html, {
        status: 200,
        headers: {
          "Content-Type": "text/html; charset=utf-8",
        },
      });
    }

    // Default to Markdown (.md)
    const markdown = generateMarkdownReport(report);
    const filename = `founderflow-report-${report.id.slice(0, 8)}.md`;

    return new NextResponse(markdown, {
      status: 200,
      headers: {
        "Content-Type": "text/markdown; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error: any) {
    console.error("[API] GET /api/reports/[id]/export error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to export report" },
      { status: 500 }
    );
  }
}

