import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import type {
  StageName,
  IdeaAnalysis,
  TargetAudience,
  CompetitorResearch,
  MarketOpportunities,
  CustomerDiscoveryQuestions,
  BusinessStrategies,
  FinalReport,
} from "@/types";

const anthropicApiKey = process.env.ANTHROPIC_API_KEY;

let anthropicClient: Anthropic | null = null;
if (anthropicApiKey && !anthropicApiKey.includes("sk-ant-api03-sample")) {
  anthropicClient = new Anthropic({
    apiKey: anthropicApiKey,
  });
}

/**
 * Call Anthropic Claude with strict JSON output, Zod schema validation, and automatic 1-time retry
 */
export async function callClaudeWithZod<T>(
  schema: z.ZodType<T>,
  systemPrompt: string,
  userPrompt: string,
  schemaName: string
): Promise<T> {
  if (!anthropicClient) {
    throw new Error("ANTHROPIC_API_KEY is not set or invalid.");
  }

  const model = "claude-3-5-sonnet-20241022";

  // Attempt 1
  let rawText = "";
  try {
    const response = await anthropicClient.messages.create({
      model,
      max_tokens: 4096,
      temperature: 0.2,
      system: `${systemPrompt}\n\nCRITICAL INSTRUCTION: You MUST return strictly valid JSON matching the ${schemaName} schema. Do NOT enclose your output in markdown backticks or commentary. Only return the raw JSON string starting with { and ending with }.`,
      messages: [
        {
          role: "user",
          content: userPrompt,
        },
      ],
    });

    const firstBlock = response.content[0];
    if (firstBlock && firstBlock.type === "text") {
      rawText = firstBlock.text;
    }
  } catch (err: any) {
    console.error("[Claude] API call failed on attempt 1:", err);
    throw new Error(`Anthropic API error: ${err.message || "Unknown error"}`);
  }

  // Parse & Validate Attempt 1
  const cleanJson = extractJsonString(rawText);
  let parsedJson: any;
  try {
    parsedJson = JSON.parse(cleanJson);
    const validated = schema.safeParse(parsedJson);
    if (validated.success) {
      return validated.data;
    }
    console.warn(`[Claude] Zod validation failed on attempt 1 for ${schemaName}:`, validated.error.format());
  } catch (parseErr) {
    console.warn(`[Claude] JSON parse error on attempt 1 for ${schemaName}:`, parseErr);
  }

  // Attempt 2: 1-time retry with error feedback
  console.log(`[Claude] Retrying ${schemaName} with self-correction prompt...`);
  try {
    const retryResponse = await anthropicClient.messages.create({
      model,
      max_tokens: 4096,
      temperature: 0.1,
      system: `${systemPrompt}\n\nYou are fixing an invalid JSON response. Return ONLY valid JSON with no markdown wrapping, no introductory text.`,
      messages: [
        {
          role: "user",
          content: userPrompt,
        },
        {
          role: "assistant",
          content: rawText,
        },
        {
          role: "user",
          content: `Your previous response failed validation. Please fix all formatting or missing schema fields and output ONLY valid JSON matching the required schema: ${schemaName}.`,
        },
      ],
    });

    const retryBlock = retryResponse.content[0];
    if (retryBlock && retryBlock.type === "text") {
      const retryClean = extractJsonString(retryBlock.text);
      const retryParsed = JSON.parse(retryClean);
      return schema.parse(retryParsed);
    }
  } catch (retryErr: any) {
    console.error(`[Claude] Retry failed for ${schemaName}:`, retryErr);
    throw new Error(`Failed to generate valid ${schemaName} after retry: ${retryErr.message}`);
  }

  throw new Error(`Failed to produce valid ${schemaName} from Claude.`);
}

function extractJsonString(text: string): string {
  let cleaned = text.trim();
  if (cleaned.startsWith("```json")) {
    cleaned = cleaned.replace(/^```json\s*/, "").replace(/```$/, "").trim();
  } else if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```\s*/, "").replace(/```$/, "").trim();
  }
  const firstBrace = cleaned.indexOf("{");
  const lastBrace = cleaned.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    return cleaned.slice(firstBrace, lastBrace + 1);
  }
  return cleaned;
}

// =========================================================================
// HIGH-QUALITY MOCK GENERATOR FALLBACKS (If ANTHROPIC_API_KEY is not set)
// Enables out-of-the-box local testing and zero-crash developer experience
// =========================================================================

export function generateMockIdeaAnalysis(idea: string, industry?: string | null): IdeaAnalysis {
  const ind = industry || "Technology / Software";
  return {
    problem: `Founders in ${ind} struggle with unstructured, time-consuming market validation. Traditional agency research costs $10k+ and takes weeks, while manual web searching is disjointed and prone to confirmation bias.`,
    solution: `An autonomous AI research co-pilot tailored for "${idea.slice(0, 60)}". It aggregates verified market intelligence, analyzes direct competitors, extracts customer discovery questions, and synthesizes strategic beachhead recommendations.`,
    valueProposition: `Cut startup research time from 40 hours to 4 minutes with human-in-the-loop AI validation, live web data verification, and actionable discovery roadmaps.`,
    businessModel: `Freemium B2B SaaS with pay-per-report credits ($29/report) and monthly subscription ($79/mo) for serial entrepreneurs, venture studios, and accelerators.`,
    targetCustomerOverview: `Early-stage tech founders, solo entrepreneurs, product managers building 0-to-1 ventures, and venture scout analysts.`,
    coreAssumptions: [
      "Founders value speed and structured synthesis over reading hundreds of raw web pages.",
      "Customer discovery questions generated with 'The Mom Test' methodology provide higher conversion than generic prompts.",
      "Human-in-the-loop stage approvals build trust and prevent hallucinated business decisions.",
    ],
    strengths: [
      "Instant turnaround compared to traditional consulting or manual research.",
      "Transparent citations and verifiable source links for every competitor claim.",
      "Structured data model ready for immediate export into pitch decks and customer interviews.",
    ],
    weaknesses: [
      "Requires founder domain intuition to choose the best strategic wedge.",
      "Niche enterprise industries with private databases may have limited public web signals.",
    ],
    opportunitySummary: `Strong initial market signal with high founder willingness to pay for de-risking capital and time investment before writing code.`,
  };
}

export function generateMockTargetAudience(idea: string): TargetAudience {
  return {
    segments: [
      {
        name: "Solo Technical Founders & Indie Hackers",
        demographics: "Software engineers, designers, solo creators aged 24-42. High technical skill, limited marketing/sales experience. Budget: $50 - $300/mo.",
        painPoints: [
          "Tendency to build product before validating market demand.",
          "Overwhelmed by competitive analysis and market sizing jargon.",
          "Dread conducting unstructured customer interviews.",
        ],
        buyingMotivations: [
          "Desire to avoid spending 6 months building something nobody wants.",
          "Need clear, tactical GTM steps they can execute immediately.",
        ],
        whereToReachThem: [
          "Indie Hackers community, X (Twitter) #buildinpublic",
          "r/SaaS and r/Entrepreneur subreddits",
          "Hacker News 'Ask HN' discussions",
        ],
        earlyAdopterSignal: "Actively posting on X or Reddit asking for feedback on landing pages or looking for early beta testers.",
      },
      {
        name: "Venture Studio & Accelerator Associates",
        demographics: "Associates and analysts at seed accelerators, startup studios, and corporate innovation labs. High volume of pitch deck intake. Budget: $2,000 - $10,000/yr.",
        painPoints: [
          "Manual screening of 50+ inbound startup applications per week.",
          "Inconsistent competitor vetting and market size due diligence.",
          "Need standardized research briefs for investment committee meetings.",
        ],
        buyingMotivations: [
          "10x speedup in preliminary deal screening.",
          "Consistent, exportable due diligence documentation for partners.",
        ],
        whereToReachThem: [
          "Venture Capital Slack communities and WhatsApp investor syndicates",
          "LinkedIn Enterprise Outreach",
          "Techstars / YC alumni networks",
        ],
        earlyAdopterSignal: "High portfolio intake volume and frequent mentions of automated screening tools.",
      },
      {
        name: "Second-Time Founders & Agency Pivoters",
        demographics: "Experienced professionals launching high-ticket B2B ventures. Well-capitalized ($10k - $50k initial self-funding budget).",
        painPoints: [
          "High opportunity cost of their personal time.",
          "Demands high rigor in pricing models and unit economics from day one.",
        ],
        buyingMotivations: [
          "Accelerates executive decision-making and pitch deck completion.",
          "Pre-built Mom Test interview scripts to test enterprise willingness to pay.",
        ],
        whereToReachThem: [
          "Reforge community, On Deck founders network",
          "Industry-specific podcasts and newsletters",
        ],
        earlyAdopterSignal: "Currently validating problem statements with ex-colleagues or advisory boards.",
      },
    ],
    primaryBeachhead: "Solo Technical Founders & Indie Hackers: Highest urgency, immediate purchasing authority without corporate committee approvals, and viral sharing behaviors on public social channels.",
    recommendedPersona: "Alex, a 31-year-old senior engineer who has built two side projects that got zero users. Alex wants to start a venture around this space but refuses to write a single line of backend code before validating customer willingness to pay.",
  };
}

export function generateMockCompetitors(idea: string, sources: any[]): CompetitorResearch {
  return {
    competitors: [
      {
        name: "VenturusAI",
        url: "https://venturusai.com",
        description: "AI business plan generator that produces instant SWOT and PESTLE analyses from simple prompts.",
        pricing: "Freemium / $19 - $49 one-time credit bundles",
        strengths: ["Fast generation", "Visually clean generic charts"],
        weaknesses: ["Lacks live web search data", "No human-in-the-loop review", "Static non-actionable suggestions"],
        differentiationGap: "FounderFlow AI conducts live web citations, stage-by-stage founder approvals, and tailored customer discovery interview scripts.",
      },
      {
        name: "IdeaProof / ValidatorAI",
        url: "https://validatorai.com",
        description: "Automated business idea feedback tool offering quick pros/cons and surface-level ratings.",
        pricing: "Free with ad-supported / $20 pro unlocks",
        strengths: ["Large organic traffic", "Immediate response"],
        weaknesses: ["Generic boilerplate advice", "No competitor pricing breakdowns or deep strategic options"],
        differentiationGap: "Deep pipeline with structured Mom Test questions, GTM trade-offs, and multi-stage iterative refinement.",
      },
      {
        name: "Statista / CB Insights (Enterprise)",
        url: "https://www.cbinsights.com",
        description: "Institutional market intelligence platform with extensive private market funding data.",
        pricing: "$15,000+ per year",
        strengths: ["Authoritative database", "Deep enterprise credibility"],
        weaknesses: ["Prohibitively expensive for early founders", "Data overload without tactical founder execution steps"],
        differentiationGap: "Accessible on-demand research at 1/100th the price, specifically calibrated for day-1 founder action.",
      },
      {
        name: "Manual Agency / Upwork Researchers",
        url: "https://www.upwork.com",
        description: "Freelance market analysts and MBA consultants producing custom slide decks.",
        pricing: "$500 - $3,500 per project",
        strengths: ["High custom human touch", "Custom interview execution"],
        weaknesses: ["Takes 1-3 weeks turnaround", "Varying quality and unpredictable reliability"],
        differentiationGap: "Combines AI speed with founder steering and approval in under 5 minutes.",
      },
    ],
    marketLandscape: "The market is split between surface-level AI gimmick wrappers that generate vague advice and six-figure enterprise suites out of reach for pre-seed founders. The winning sweet spot is verified, cited research paired with human oversight.",
    defensibilityStrategy: "Build proprietary domain graph connections, integrate verified live web data, and retain founder feedback loops that compound prompt relevance over time.",
    sources: sources.length > 0 ? sources : [
      { title: "Top AI Startup Tools Index", url: "https://theresanaiforthat.com", snippet: "Directory of early stage founder productivity software." },
      { title: "SaaS Market Benchmarks 2025", url: "https://openviewpartners.com", snippet: "Key conversion metrics for self-serve B2B SaaS." },
    ],
  };
}

export function generateMockMarketOpportunities(idea: string, sources: any[]): MarketOpportunities {
  return {
    marketSizeSignals: {
      tamSignals: "$14.2B Global Market Research & Business Intelligence software market expanding at 11.4% CAGR through 2030.",
      samSignals: "$2.8B addressable spend among early-stage startups, pre-seed incubators, and solopreneurs seeking automated research tools.",
      somSignals: "$45M realistic serviceable capture over 3 years by targeting 15,000 active English-speaking founders at $250 annual ARPU.",
      growthRateOrDriver: "Explosion of solopreneurs and AI-native micro-SaaS companies enabled by modern developer tooling.",
    },
    trends: [
      "AI-driven validation replacing speculative 50-page business plans.",
      "Rising cost of digital customer acquisition driving extreme focus on tight beachhead niches.",
      "Investors requiring proof of customer discovery and early signups before seed checks.",
    ],
    underservedNiches: [
      "Bootstrapped engineers who know how to code but lack customer interview skills.",
      "Corporate innovation scouts who need quick 1-pagers to kill bad internal projects fast.",
      "University entrepreneurship programs needing standardized teaching tools.",
    ],
    risks: [
      {
        risk: "Low barrier to entry for trivial AI wrappers that flood search results.",
        severity: "medium",
        mitigation: "Differentiate with live web search, verified source citations, and human-in-the-loop workflow.",
      },
      {
        risk: "Founders may abandon research if the pipeline feels slow or rigid.",
        severity: "low",
        mitigation: "Allow instant 'Approve All' flow alongside granular card-by-card editing and regeneration.",
      },
      {
        risk: "Hallucinated competitor pricing or expired domains.",
        severity: "high",
        mitigation: "Strict Tavily live search retrieval with explicit link verification and source badges.",
      },
    ],
    timingRationale: "LLM capabilities have matured to reliably evaluate logic, extract structured schemas, and synthesize live web search with zero latency penalty.",
    sources: sources.length > 0 ? sources : [
      { title: "Gartner Emerging Tech Horizon 2025", url: "https://www.gartner.com", snippet: "Autonomous AI agents in business operations." },
      { title: "Statista Startups & Entrepreneurship Report", url: "https://www.statista.com", snippet: "Over 5 million new businesses registered annually in North America." },
    ],
  };
}

export function generateMockCustomerDiscovery(): CustomerDiscoveryQuestions {
  return {
    themes: [
      {
        theme: "Problem Exploration (Past Behavior)",
        description: "Uncover how the customer experiences the problem today without mentioning your proposed product.",
        questions: [
          {
            question: "When was the last time you decided to research or validate a new startup idea or feature? Walk me through what happened.",
            purpose: "Validates if they actually experience the problem recently, not just in theory.",
            followUpHint: "Listen for emotional frustration or specific hours lost.",
          },
          {
            question: "What was the hardest or most tedious part of that entire process?",
            purpose: "Identifies the acute bottleneck that they would pay to remove.",
            followUpHint: "Ask: 'Why was that hard? What made it take so long?'",
          },
          {
            question: "How often do you find yourself needing to evaluate competitors or market sizes?",
            purpose: "Determines frequency of use (one-time vs recurring monthly workflow).",
            followUpHint: "Ask: 'What triggered that research last month?'",
          },
        ],
      },
      {
        theme: "Current Solutions & Workarounds",
        description: "Assess what tools, spreadsheets, or freelancers they have already spent money or time on.",
        questions: [
          {
            question: "What tools, websites, or hacks are you currently using to get that research done?",
            purpose: "Verifies if the problem is painful enough that they actively sought a workaround.",
            followUpHint: "Ask: 'Can you show me your last spreadsheet or doc?'",
          },
          {
            question: "What do you love and what do you hate about the current tools you rely on?",
            purpose: "Reveals the exact product feature gaps you need to beat incumbents.",
            followUpHint: "Probe on specific missing data points or annoying workflow steps.",
          },
          {
            question: "Have you ever paid for a research report, database, or freelancer? If so, roughly how much was it?",
            purpose: "Tests historical willingness to spend real budget on this problem.",
            followUpHint: "If they say no, ask: 'Did you consider paying someone, and why did you decide against it?'",
          },
        ],
      },
      {
        theme: "Willingness to Pay & Decision Making",
        description: "Examine their budget thresholds and purchasing authority without asking 'Would you buy this?'.",
        questions: [
          {
            question: "Who in your team or company has to sign off when you buy a software subscription like this?",
            purpose: "Maps out the buying decision chain (self-serve swipe vs procurement review).",
            followUpHint: "Ask: 'What was the last tool under $100 you purchased without approval?'",
          },
          {
            question: "If a tool solved this bottleneck completely tomorrow, what would you do with the extra time saved?",
            purpose: "Quantifies the business ROI and emotional payoff.",
            followUpHint: "Look for high-value activities like coding, sales, or investor meetings.",
          },
          {
            question: "What is your biggest fear or hesitation when considering using an AI agent for business critical decisions?",
            purpose: "Uncovers trust, privacy, or accuracy objections you must solve upfront in the UI.",
            followUpHint: "Ask: 'What would make you confident enough to show the output to your co-founder or investor?'",
          },
        ],
      },
    ],
    interviewTips: [
      "Rule 1: Talk about their life and past behavior, NOT your idea or hypothetical features.",
      "Rule 2: Never ask 'Would you buy this?' - people always say yes to be polite.",
      "Rule 3: Dig into specifics: 'Tell me about the last time that happened', not 'What do you usually do?'.",
      "Rule 4: Keep your mouth shut and listen at least 80% of the conversation.",
    ],
  };
}

export function generateMockBusinessStrategies(idea: string): BusinessStrategies {
  return {
    strategies: [
      {
        title: "Strategy A: Self-Serve Product-Led Growth (Freemium + Credit Packs)",
        positioning: "The 5-minute automated research co-pilot for solo founders and indie builders.",
        goToMarket: "Viral organic loops: free 1-stage report with watermarked export, sharing on X / LinkedIn, and open startup directory SEO pages.",
        pricingModel: "1 Free Report, then $29 pay-as-you-go per full report, or $79/mo unlimited pro tier.",
        mvpScope: [
          "Landing page with instant 1-click report generation",
          "Export to clean Markdown and PDF",
          "Built-in Mom Test interview script copy button",
        ],
        pros: ["Low friction onboarding", "High potential for organic word-of-mouth", "Rapid user feedback cycles"],
        cons: ["Requires high traffic volume to achieve significant monthly revenue", "Higher compute/search costs on free tier"],
        firstStep: "Ship a public interactive demo page on X and ProductHunt to collect 100 free user feedback submissions.",
        timelineEstimate: "2 - 3 weeks to first revenue",
      },
      {
        title: "Strategy B: High-Touch Agency to Automated Platform",
        positioning: "The venture-grade due diligence partner for funded startups and angel investors.",
        goToMarket: "Direct outbound on LinkedIn to accelerator managers, angel syndicates, and seed venture associates.",
        pricingModel: "$499/mo per seat with concierge analyst QA and white-labeled investor memo templates.",
        mvpScope: [
          "Curated analyst review step before delivery",
          "Custom branding and white-label export",
          "Integration with Crunchbase / PitchBook data feeds",
        ],
        pros: ["Immediate high contract values ($5k - $15k ACV)", "Direct founder relationships and deep retention"],
        cons: ["Longer sales cycles", "Requires manual touchpoints during early phases"],
        firstStep: "Reach out to 25 accelerator directors with a personalized, sample research memo for one of their portfolio startups.",
        timelineEstimate: "4 - 6 weeks to first high-ticket contract",
      },
      {
        title: "Strategy C: Embedded API & B2B Integration Wedge",
        positioning: "The 'Research-as-a-Service' API powering incubators, venture tools, and domain registrars.",
        goToMarket: "Partner with startup formation services (e.g. Stripe Atlas, Firstbase) and website builders.",
        pricingModel: "$0.50 - $2.00 per generated pipeline report via metered REST API.",
        mvpScope: [
          "Robust API endpoint with webhook callbacks",
          "Developer docs and playground",
          "Tenant-isolated rate limiting and analytics",
        ],
        pros: ["Massive scale without direct consumer marketing", "Stickiness once embedded into partner workflows"],
        cons: ["Long partner integration lead times", "Lower gross margins per unit"],
        firstStep: "Build an open-source SDK and create sample integration with popular startup tools.",
        timelineEstimate: "8 - 12 weeks",
      },
    ],
    recommendedStrategyIndex: 0,
    decisionCriteria: [
      "Select Strategy A if you are a solo builder who wants fast validation, direct customer conversations, and viral social adoption.",
      "Select Strategy B if you have existing venture capital connections and prefer 10 high-paying clients over 1,000 low-paying users.",
      "Select Strategy C once you have proven the underlying agent pipeline and want enterprise distribution scale.",
    ],
  };
}

export function generateMockFinalReport(idea: string): FinalReport {
  return {
    executiveSummary: `FounderFlow AI research assessment for "${idea.slice(0, 80)}". This venture operates in a fertile window driven by the proliferation of AI-native tooling, increasing founder demand for de-risking capital before development, and acute dissatisfaction with generic AI wrappers. By anchoring on verified live web citations, rigorous Mom Test discovery questions, and a human-in-the-loop review workflow, the proposed solution possesses a clear wedge against both static incumbent databases and superficial prompt generators.`,
    ventureScorecard: {
      marketAttractiveness: 8,
      solutionFeasibility: 9,
      competitiveMoat: 7,
      overallViability: 8,
      rationale: "High customer urgency and low initial technical barrier, balanced by the need to build brand defensibility and proprietary research workflows to prevent copycats.",
    },
    keyFindings: [
      "Founders strongly reject 40-page theoretical business plans in favor of tactical 5-minute action roadmaps.",
      "Incumbents either charge prohibitive enterprise prices ($15k/yr) or offer hallucination-prone generic summaries.",
      "Customer discovery interview scripts that strictly eliminate leading questions represent the highest perceived value feature.",
      "The recommended initial beachhead is solo technical founders who have strong engineering skills but dread market research and sales outreach.",
      "A self-serve freemium model with $29 credit packs or $79/mo subscription provides the fastest path to profitability.",
    ],
    criticalRisksAndNextSteps: [
      "Risk of AI hallucination on competitor pricing: Mitigated by mandatory live web citations and human-in-the-loop review cards.",
      "Risk of low repeat usage: Mitigated by offering continuous market trend alerts and multi-project workspace tracking.",
      "Immediate next step: Conduct 5 customer discovery interviews using the generated Mom Test questions before writing further code.",
    ],
    immediate7DayActionPlan: [
      {
        day: "Days 1 - 2",
        action: "Schedule and conduct 5 customer discovery interviews with founders using the generated questions.",
        outcome: "Identify top 3 burning objections and confirm pricing threshold.",
      },
      {
        day: "Days 3 - 4",
        action: "Create a 1-page interactive landing page with a sample live research report and email waitlist.",
        outcome: "Measure organic conversion rate and collect 50 early founder signups.",
      },
      {
        day: "Days 5 - 6",
        action: "Launch MVP on X (#buildinpublic) and relevant founder subreddits with transparent live demo.",
        outcome: "First 10 paid report generation credits purchased.",
      },
      {
        day: "Day 7",
        action: "Synthesize customer feedback, review drop-off metrics, and plan initial feature refinements.",
        outcome: "Clear product roadmap prioritized strictly by user feedback.",
      },
    ],
    disclaimer: "AI-generated research. Verify before making decisions.",
  };
}

