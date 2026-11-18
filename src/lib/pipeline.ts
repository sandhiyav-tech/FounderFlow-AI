import { reportRepository } from "@/db";
import { searchWeb } from "./tavily";
import {
  callClaudeWithZod,
  generateMockIdeaAnalysis,
  generateMockTargetAudience,
  generateMockCompetitors,
  generateMockMarketOpportunities,
  generateMockCustomerDiscovery,
  generateMockBusinessStrategies,
  generateMockFinalReport,
} from "./anthropic";
import {
  STAGE_NAMES,
  type StageName,
  type SourceLink,
  type ReportRecord,
  IdeaAnalysisSchema,
  TargetAudienceSchema,
  CompetitorResearchSchema,
  MarketOpportunitiesSchema,
  CustomerDiscoveryQuestionsSchema,
  BusinessStrategiesSchema,
  FinalReportSchema,
} from "@/types";

export async function runPipelineStage(
  reportId: string,
  stageName: StageName,
  fallbackReport?: ReportRecord
) {
  let report = await reportRepository.getReport(reportId);

  // If report not found in DB/memory (stateless serverless environment), use fallback from client
  if (!report && fallbackReport) {
    report = fallbackReport;
    try {
      await reportRepository.createReport({
        id: fallbackReport.id,
        userId: fallbackReport.userId || "anon",
        idea: fallbackReport.idea,
        industry: fallbackReport.industry || undefined,
        region: fallbackReport.region || undefined,
        budget: fallbackReport.budget || undefined,
        initialStages: (fallbackReport.stages || []).map((s) => ({
          id: s.id,
          name: s.name,
          orderIndex: s.orderIndex,
        })),
      });
    } catch {
      // Ignore fallback re-registration errors
    }
  }

  if (!report) {
    throw new Error(`Report not found with ID ${reportId}`);
  }

  // Update stage status to generating
  await reportRepository.updateStage({
    reportId,
    stageName,
    status: "generating",
    error: null,
  });

  try {
    // Collect context from all completed stages so far
    const previousStagesContext: Record<string, any> = {};
    for (const s of report.stages || []) {
      if (s.name !== stageName && s.output && (s.status === "approved" || s.status === "generated")) {
        previousStagesContext[s.name] = s.output;
      }
    }

    const hasAnthropicKey =
      Boolean(process.env.ANTHROPIC_API_KEY) &&
      !process.env.ANTHROPIC_API_KEY?.includes("sk-ant-api03-sample");

    let stageOutput: any = null;
    let stageSources: SourceLink[] = [];

    // Base context string
    const baseContext = `
STARTUP IDEA: ${report.idea}
INDUSTRY: ${report.industry || "General Startup / Technology"}
TARGET REGION: ${report.region || "Global / North America"}
ESTIMATED BUDGET: ${report.budget || "Bootstrapped / Pre-seed"}

PRIOR APPROVED RESEARCH CONTEXT:
${JSON.stringify(previousStagesContext, null, 2)}
`;

    switch (stageName) {
      case "idea_analysis": {
        if (hasAnthropicKey) {
          stageOutput = await callClaudeWithZod(
            IdeaAnalysisSchema,
            "You are FounderFlow AI, an elite venture research analyst. Analyze this early-stage business idea with surgical precision.",
            `${baseContext}\nAnalyze the problem, proposed solution, compelling value proposition, business model mechanics, core assumptions to validate, strengths, weaknesses, and initial opportunity summary.`,
            "IdeaAnalysis"
          );
        } else {
          stageOutput = generateMockIdeaAnalysis(report.idea, report.industry);
        }
        break;
      }

      case "target_audience": {
        if (hasAnthropicKey) {
          stageOutput = await callClaudeWithZod(
            TargetAudienceSchema,
            "You are FounderFlow AI, specializing in customer segmentation and beachhead market selection for early ventures.",
            `${baseContext}\nIdentify 2 to 4 distinct customer segments with demographics, burning pain points, buying motivations, and specific channels/communities to reach them. Highlight the single highest-urgency beachhead segment and a vivid customer persona.`,
            "TargetAudience"
          );
        } else {
          stageOutput = generateMockTargetAudience(report.idea);
        }
        break;
      }

      case "competitor_research": {
        // Run live web search via Tavily
        const searchQuery = `${report.industry || "SaaS"} ${report.idea.slice(0, 40)} competitors alternatives pricing`;
        const searchResult = await searchWeb(searchQuery, { searchDepth: "advanced", maxResults: 6 });
        stageSources = searchResult.sources;

        if (hasAnthropicKey) {
          const compPrompt = `
${baseContext}

LIVE WEB RESEARCH RESULTS:
${JSON.stringify(searchResult.rawResults, null, 2)}

Provide 4 to 8 competitors (both direct and indirect). For each competitor, specify their name, official website URL, description, pricing model, strengths, weaknesses, and the differentiation white-space gap. Also provide a synthesis of the market landscape and defensibility strategy. Include the sources provided.
`;
          stageOutput = await callClaudeWithZod(
            CompetitorResearchSchema,
            "You are FounderFlow AI, a competitive intelligence specialist. Analyze competitors based on live market evidence.",
            compPrompt,
            "CompetitorResearch"
          );
          if (!stageOutput.sources || stageOutput.sources.length === 0) {
            stageOutput.sources = stageSources;
          }
        } else {
          stageOutput = generateMockCompetitors(report.idea, stageSources);
        }
        break;
      }

      case "market_opportunities": {
        // Run market trends search
        const marketQuery = `${report.industry || "startup"} market size trends opportunities risks 2025`;
        const searchResult = await searchWeb(marketQuery, { searchDepth: "basic", maxResults: 5 });
        stageSources = searchResult.sources;

        if (hasAnthropicKey) {
          const marketPrompt = `
${baseContext}

LIVE WEB RESEARCH SIGNALS:
${JSON.stringify(searchResult.rawResults, null, 2)}

Analyze market size signals (TAM, SAM, SOM signals and growth drivers), key emerging trends, underserved niches, and top risks with concrete mitigations. Explain the 'Why Now?' timing rationale. Include the sources.
`;
          stageOutput = await callClaudeWithZod(
            MarketOpportunitiesSchema,
            "You are FounderFlow AI, a venture capital market analyst assessing macro market size, timing, and structural tailwinds.",
            marketPrompt,
            "MarketOpportunities"
          );
          if (!stageOutput.sources || stageOutput.sources.length === 0) {
            stageOutput.sources = stageSources;
          }
        } else {
          stageOutput = generateMockMarketOpportunities(report.idea, stageSources);
        }
        break;
      }

      case "customer_discovery_questions": {
        if (hasAnthropicKey) {
          stageOutput = await callClaudeWithZod(
            CustomerDiscoveryQuestionsSchema,
            "You are FounderFlow AI, trained in Rob Fitzpatrick's 'The Mom Test' methodology. Formulate non-leading, deeply revealing customer discovery questions.",
            `${baseContext}\nFormulate 10 to 15 customer interview questions grouped by theme: Problem Exploration, Current Solutions & Workarounds, and Willingness to Pay & Decision Making. NEVER ask hypothetical questions like 'Would you buy this?'. Always ask about past concrete behaviors. Include interview tips.`,
            "CustomerDiscoveryQuestions"
          );
        } else {
          stageOutput = generateMockCustomerDiscovery();
        }
        break;
      }

      case "business_strategies": {
        if (hasAnthropicKey) {
          stageOutput = await callClaudeWithZod(
            BusinessStrategiesSchema,
            "You are FounderFlow AI, an experienced startup growth architect. Provide actionable, differentiated business strategy options.",
            `${baseContext}\nGenerate 3 to 5 distinct strategic playbooks (e.g. Self-Serve PLG, High-Touch B2B, Marketplace/API). Detail positioning, GTM distribution, pricing model, essential MVP scope, pros, cons, and a concrete first step to take in 48 hours. Recommend the best option and explain decision criteria.`,
            "BusinessStrategies"
          );
        } else {
          stageOutput = generateMockBusinessStrategies(report.idea);
        }
        break;
      }

      case "final_report": {
        if (hasAnthropicKey) {
          stageOutput = await callClaudeWithZod(
            FinalReportSchema,
            "You are FounderFlow AI, synthesizing an executive venture summary with a quantitative venture scorecard and immediate 7-day tactical action plan.",
            `${baseContext}\nSynthesize all 6 prior stages into an executive summary, venture viability scorecard (market attractiveness, feasibility, moat, overall viability out of 10), top 5 key findings, critical risks, and an immediate 7-day tactical action plan.`,
            "FinalReport"
          );
        } else {
          stageOutput = generateMockFinalReport(report.idea);
        }
        break;
      }
    }

    // Save to repository
    await reportRepository.updateStage({
      reportId,
      stageName,
      output: stageOutput,
      status: "generated",
      sources: stageSources.length > 0 ? stageSources : (stageOutput?.sources || []),
      error: null,
    });

    // Update report status to in_review if draft
    if (report.status === "draft") {
      await reportRepository.updateReportStatus({
        reportId,
        status: "in_review",
      });
    }

    const updated = await reportRepository.getReport(reportId);
    const finalStage = updated?.stages?.find((s) => s.name === stageName) || {
      id: `stage-${stageName}`,
      reportId,
      name: stageName,
      orderIndex: STAGE_NAMES.indexOf(stageName),
      status: "generated" as const,
      output: stageOutput,
      sources: stageSources.length > 0 ? stageSources : (stageOutput?.sources || []),
      updatedAt: new Date().toISOString(),
    };

    return finalStage;
  } catch (err: any) {
    console.error(`[Pipeline] Failed running stage ${stageName}:`, err);
    await reportRepository.updateStage({
      reportId,
      stageName,
      status: "error",
      error: err.message || "Failed to generate stage output.",
    });
    throw err;
  }
}
