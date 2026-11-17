import { z } from "zod";

export const STAGE_NAMES = [
  "idea_analysis",
  "target_audience",
  "competitor_research",
  "market_opportunities",
  "customer_discovery_questions",
  "business_strategies",
  "final_report",
] as const;

export type StageName = (typeof STAGE_NAMES)[number];

export const STAGE_CONFIG: Record<
  StageName,
  {
    order: number;
    title: string;
    shortDesc: string;
    icon: string;
  }
> = {
  idea_analysis: {
    order: 1,
    title: "Idea Analysis",
    shortDesc: "Problem, solution, value proposition, assumptions & SWOT",
    icon: "Lightbulb",
  },
  target_audience: {
    order: 2,
    title: "Target Audience",
    shortDesc: "Customer segments, pain points, motivations & channels",
    icon: "Users",
  },
  competitor_research: {
    order: 3,
    title: "Competitor Research",
    shortDesc: "Live web search on rivals, pricing, gaps & sources",
    icon: "Search",
  },
  market_opportunities: {
    order: 4,
    title: "Market Opportunities",
    shortDesc: "Market size signals, trends, niches & key risks",
    icon: "TrendingUp",
  },
  customer_discovery_questions: {
    order: 5,
    title: "Customer Discovery",
    shortDesc: "10-15 Mom Test interview questions grouped by theme",
    icon: "MessageSquare",
  },
  business_strategies: {
    order: 6,
    title: "Business Strategies",
    shortDesc: "3-5 GTM, positioning, pricing & MVP action options",
    icon: "Compass",
  },
  final_report: {
    order: 7,
    title: "Final Executive Report",
    shortDesc: "Consolidated synthesis, viability scorecard & 7-day plan",
    icon: "FileCheck",
  },
};

export type StageStatus = "pending" | "generating" | "generated" | "approved" | "error";
export type ReportStatus = "draft" | "in_review" | "approved";

// ==========================================
// ZOD SCHEMAS FOR EACH STAGE
// ==========================================

export const IdeaAnalysisSchema = z.object({
  problem: z.string().describe("Core problem and pain points founders are addressing"),
  solution: z.string().describe("Clear, concise description of the proposed solution"),
  valueProposition: z.string().describe("Unique compelling reason customers choose this"),
  businessModel: z.string().describe("High-level revenue model and monetization mechanics"),
  targetCustomerOverview: z.string().describe("Quick summary of who this is built for"),
  coreAssumptions: z.array(z.string()).describe("Key unverified assumptions that make or break this idea"),
  strengths: z.array(z.string()).describe("Inherent strengths and unfair advantages"),
  weaknesses: z.array(z.string()).describe("Inherent vulnerabilities and execution risks"),
  opportunitySummary: z.string().describe("Overall assessment of the initial idea thesis"),
});
export type IdeaAnalysis = z.infer<typeof IdeaAnalysisSchema>;

export const CustomerSegmentSchema = z.object({
  name: z.string().describe("Segment label (e.g. Solo SaaS Founders, Enterprise Heads of Ops)"),
  demographics: z.string().describe("Demographics, firmographics, team size, budget capacity"),
  painPoints: z.array(z.string()).describe("Top 2-4 burning problems this segment faces daily"),
  buyingMotivations: z.array(z.string()).describe("Why they are willing to pull out their wallet"),
  whereToReachThem: z.array(z.string()).describe("Specific subreddits, communities, channels, conferences"),
  earlyAdopterSignal: z.string().describe("Behavior that indicates they are desperate for a solution now"),
});

export const TargetAudienceSchema = z.object({
  segments: z.array(CustomerSegmentSchema).min(2).max(4).describe("2-4 distinct customer segments"),
  primaryBeachhead: z.string().describe("The single best segment to launch with first and why"),
  recommendedPersona: z.string().describe("Vivid snapshot of the ideal day-1 customer"),
});
export type TargetAudience = z.infer<typeof TargetAudienceSchema>;

export const CompetitorItemSchema = z.object({
  name: z.string().describe("Name of the competitor"),
  url: z.string().describe("Official website URL"),
  description: z.string().describe("What they do and who they serve"),
  pricing: z.string().describe("Pricing model or estimated pricing tier"),
  strengths: z.array(z.string()).describe("What they do exceptionally well"),
  weaknesses: z.array(z.string()).describe("Known customer complaints, limitations or gaps"),
  differentiationGap: z.string().describe("The clear white-space gap the founder can exploit"),
});

export const SourceLinkSchema = z.object({
  title: z.string(),
  url: z.string(),
  snippet: z.string().optional(),
});
export type SourceLink = z.infer<typeof SourceLinkSchema>;

export const CompetitorResearchSchema = z.object({
  competitors: z.array(CompetitorItemSchema).min(3).max(8).describe("Direct and indirect competitors"),
  marketLandscape: z.string().describe("Overview of the competitive landscape"),
  defensibilityStrategy: z.string().describe("How a new entrant can build an enduring moat"),
  sources: z.array(SourceLinkSchema).describe("Live web search citations and links"),
});
export type CompetitorResearch = z.infer<typeof CompetitorResearchSchema>;

export const MarketRiskSchema = z.object({
  risk: z.string(),
  severity: z.enum(["low", "medium", "high"]),
  mitigation: z.string(),
});

export const MarketOpportunitiesSchema = z.object({
  marketSizeSignals: z.object({
    tamSignals: z.string().describe("Total Addressable Market qualitative or quantitative signals"),
    samSignals: z.string().describe("Serviceable Available Market estimate"),
    somSignals: z.string().describe("Realistic Serviceable Obtainable Market in Year 1-2"),
    growthRateOrDriver: z.string().describe("Macro tailwinds driving growth"),
  }),
  trends: z.array(z.string()).describe("3-5 macro and micro trends supporting this space"),
  underservedNiches: z.array(z.string()).describe("Specific overlooked sub-verticals or niches"),
  risks: z.array(MarketRiskSchema).describe("Key market, technical, or regulatory risks with mitigations"),
  timingRationale: z.string().describe("Why now? What changed in technology, consumer behavior, or regulation?"),
  sources: z.array(SourceLinkSchema).describe("Market research citations and sources"),
});
export type MarketOpportunities = z.infer<typeof MarketOpportunitiesSchema>;

export const DiscoveryQuestionSchema = z.object({
  question: z.string().describe("Open-ended question asking about past behavior, never hypothetical future"),
  purpose: z.string().describe("What specific hypothesis or truth this question tests"),
  followUpHint: z.string().describe("How to dig deeper when the interviewee answers"),
});

export const DiscoveryThemeSchema = z.object({
  theme: z.string().describe("E.g. Problem Exploration, Current Solutions & Workarounds, Willingness to Pay"),
  description: z.string().describe("Goal of this section in the customer interview"),
  questions: z.array(DiscoveryQuestionSchema),
});

export const CustomerDiscoveryQuestionsSchema = z.object({
  themes: z.array(DiscoveryThemeSchema).min(3).describe("Interview sections grouped by theme"),
  interviewTips: z.array(z.string()).describe("Golden rules for conducting non-leading customer interviews"),
});
export type CustomerDiscoveryQuestions = z.infer<typeof CustomerDiscoveryQuestionsSchema>;

export const BusinessStrategyOptionSchema = z.object({
  title: z.string().describe("Strategy name (e.g., Hyper-Niche B2B SaaS, Self-Serve PLG, High-Touch Agency to Product)"),
  positioning: z.string().describe("Market positioning and brand wedge"),
  goToMarket: z.string().describe("Initial distribution tactics and acquisition channels"),
  pricingModel: z.string().describe("Suggested pricing tiers and metric (per seat, usage, flat)"),
  mvpScope: z.array(z.string()).describe("Features absolutely required for day-1 MVP (and what to cut)"),
  pros: z.array(z.string()).describe("Advantages of choosing this strategic path"),
  cons: z.array(z.string()).describe("Downsides and resource demands"),
  firstStep: z.string().describe("Actionable task the founder should execute in the next 48 hours"),
  timelineEstimate: z.string().describe("Estimated time to first revenue/validation"),
});

export const BusinessStrategiesSchema = z.object({
  strategies: z.array(BusinessStrategyOptionSchema).min(3).max(5).describe("3-5 distinct strategic paths"),
  recommendedStrategyIndex: z.number().describe("0-based index of the recommended strategy for an early founder"),
  decisionCriteria: z.array(z.string()).describe("Guiding criteria to help founder decide"),
});
export type BusinessStrategies = z.infer<typeof BusinessStrategiesSchema>;

export const ActionPlanStepSchema = z.object({
  day: z.string().describe("E.g., Day 1-2, Day 3-4, Day 5-7"),
  action: z.string().describe("Concrete task to execute"),
  outcome: z.string().describe("Measurable milestone deliverable"),
});

export const FinalReportSchema = z.object({
  executiveSummary: z.string().describe("Crisp 2-3 paragraph executive synthesis of the venture opportunity"),
  ventureScorecard: z.object({
    marketAttractiveness: z.number().min(1).max(10).describe("Market size, tailwinds and margin potential"),
    solutionFeasibility: z.number().min(1).max(10).describe("Technical and operational ease of building"),
    competitiveMoat: z.number().min(1).max(10).describe("Defensibility against copycats"),
    overallViability: z.number().min(1).max(10).describe("Composite viability score out of 10"),
    rationale: z.string().describe("Justification for the scores"),
  }),
  keyFindings: z.array(z.string()).describe("Top 5 key insights from across all research stages"),
  criticalRisksAndNextSteps: z.array(z.string()).describe("The existential pitfalls to navigate"),
  immediate7DayActionPlan: z.array(ActionPlanStepSchema).describe("Concrete 7-day tactical roadmap"),
  disclaimer: z.string().default("AI-generated research. Verify before making decisions."),
});
export type FinalReport = z.infer<typeof FinalReportSchema>;

// Map stage names to output types
export type StageOutputMap = {
  idea_analysis: IdeaAnalysis;
  target_audience: TargetAudience;
  competitor_research: CompetitorResearch;
  market_opportunities: MarketOpportunities;
  customer_discovery_questions: CustomerDiscoveryQuestions;
  business_strategies: BusinessStrategies;
  final_report: FinalReport;
};

// Generic Stage Interface
export interface StageRecord<T extends StageName = StageName> {
  id: string;
  reportId: string;
  name: T;
  orderIndex: number;
  status: StageStatus;
  output: StageOutputMap[T] | null;
  sources: SourceLink[] | null;
  error?: string | null;
  updatedAt: string;
}

// Report Record Interface
export interface ReportRecord {
  id: string;
  userId: string;
  idea: string;
  industry?: string | null;
  region?: string | null;
  budget?: string | null;
  status: ReportStatus;
  currentStageIndex: number;
  createdAt: string;
  updatedAt: string;
  stages?: StageRecord[];
}

