import type { ReportRecord } from "@/types";

export function generateMarkdownReport(report: ReportRecord): string {
  const dateFormatted = new Date(report.createdAt).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  let md = `# FounderFlow AI — Startup Intelligence Report\n\n`;
  md += `> **Disclaimer:** AI-generated research. Verify before making decisions.\n\n`;
  md += `**Report ID:** \`${report.id}\`  \n`;
  md += `**Date:** ${dateFormatted}  \n`;
  md += `**Status:** ${report.status.toUpperCase()}  \n`;
  md += `**Industry:** ${report.industry || "General"}  \n`;
  md += `**Target Region:** ${report.region || "Global"}  \n`;
  md += `**Budget:** ${report.budget || "Bootstrapped"}  \n\n`;
  md += `## 💡 Business Idea\n\n${report.idea}\n\n`;
  md += `---\n\n`;

  const stages = report.stages || [];

  // Stage 1: Idea Analysis
  const s1 = stages.find((s) => s.name === "idea_analysis");
  if (s1 && s1.output) {
    const o = s1.output as any;
    md += `## 1. Idea Analysis & Core Thesis\n\n`;
    md += `### Problem\n${o.problem}\n\n`;
    md += `### Solution\n${o.solution}\n\n`;
    md += `### Value Proposition\n${o.valueProposition}\n\n`;
    md += `### Business Model\n${o.businessModel}\n\n`;
    md += `### Core Assumptions to Validate\n`;
    (o.coreAssumptions || []).forEach((a: string) => {
      md += `- [ ] ${a}\n`;
    });
    md += `\n### Strengths\n`;
    (o.strengths || []).forEach((str: string) => {
      md += `- ✅ ${str}\n`;
    });
    md += `\n### Weaknesses & Vulnerabilities\n`;
    (o.weaknesses || []).forEach((w: string) => {
      md += `- ⚠️ ${w}\n`;
    });
    md += `\n### Opportunity Summary\n${o.opportunitySummary}\n\n`;
    md += `---\n\n`;
  }

  // Stage 2: Target Audience
  const s2 = stages.find((s) => s.name === "target_audience");
  if (s2 && s2.output) {
    const o = s2.output as any;
    md += `## 2. Target Audience & Customer Segmentation\n\n`;
    md += `**Primary Beachhead Market:** ${o.primaryBeachhead}\n\n`;
    md += `**Recommended Ideal Customer Persona:** ${o.recommendedPersona}\n\n`;
    md += `### Customer Segments\n\n`;
    (o.segments || []).forEach((seg: any, idx: number) => {
      md += `#### Segment ${idx + 1}: ${seg.name}\n`;
      md += `* **Demographics / Firmographics:** ${seg.demographics}\n`;
      md += `* **Top Burning Pain Points:**\n`;
      (seg.painPoints || []).forEach((p: string) => {
        md += `  - ${p}\n`;
      });
      md += `* **Buying Motivations:**\n`;
      (seg.buyingMotivations || []).forEach((m: string) => {
        md += `  - ${m}\n`;
      });
      md += `* **Where to Reach Them:**\n`;
      (seg.whereToReachThem || []).forEach((ch: string) => {
        md += `  - ${ch}\n`;
      });
      md += `* **Early Adopter Signal:** ${seg.earlyAdopterSignal}\n\n`;
    });
    md += `---\n\n`;
  }

  // Stage 3: Competitor Research
  const s3 = stages.find((s) => s.name === "competitor_research");
  if (s3 && s3.output) {
    const o = s3.output as any;
    md += `## 3. Competitive Intelligence (Live Web Research)\n\n`;
    md += `### Market Landscape\n${o.marketLandscape}\n\n`;
    md += `### Competitors\n\n`;
    (o.competitors || []).forEach((comp: any) => {
      md += `#### [${comp.name}](${comp.url})\n`;
      md += `* **Description:** ${comp.description}\n`;
      md += `* **Pricing:** ${comp.pricing}\n`;
      md += `* **Key Strengths:** ${(comp.strengths || []).join(", ")}\n`;
      md += `* **Weaknesses & Gaps:** ${(comp.weaknesses || []).join(", ")}\n`;
      md += `* **Differentiation Wedge:** ${comp.differentiationGap}\n\n`;
    });
    md += `### Defensibility Strategy\n${o.defensibilityStrategy}\n\n`;
    if (s3.sources && s3.sources.length > 0) {
      md += `### Verified Web Sources & Citations\n`;
      s3.sources.forEach((src) => {
        md += `- [${src.title}](${src.url})${src.snippet ? ` — _"${src.snippet}"_` : ""}\n`;
      });
      md += `\n`;
    }
    md += `---\n\n`;
  }

  // Stage 4: Market Opportunities
  const s4 = stages.find((s) => s.name === "market_opportunities");
  if (s4 && s4.output) {
    const o = s4.output as any;
    md += `## 4. Market Size, Trends & Risks\n\n`;
    md += `### Market Size Signals\n`;
    md += `* **TAM:** ${o.marketSizeSignals?.tamSignals}\n`;
    md += `* **SAM:** ${o.marketSizeSignals?.samSignals}\n`;
    md += `* **SOM:** ${o.marketSizeSignals?.somSignals}\n`;
    md += `* **Growth Driver:** ${o.marketSizeSignals?.growthRateOrDriver}\n\n`;
    md += `### Macro Trends\n`;
    (o.trends || []).forEach((t: string) => {
      md += `- 📈 ${t}\n`;
    });
    md += `\n### Underserved Niches\n`;
    (o.underservedNiches || []).forEach((n: string) => {
      md += `- 🎯 ${n}\n`;
    });
    md += `\n### Key Risks & Mitigations\n\n`;
    (o.risks || []).forEach((r: any) => {
      md += `* **[${r.severity?.toUpperCase()}]** ${r.risk}  \n  *Mitigation:* ${r.mitigation}\n`;
    });
    md += `\n### Timing Rationale ('Why Now?')\n${o.timingRationale}\n\n`;
    if (s4.sources && s4.sources.length > 0) {
      md += `### Market Sources\n`;
      s4.sources.forEach((src) => {
        md += `- [${src.title}](${src.url})\n`;
      });
      md += `\n`;
    }
    md += `---\n\n`;
  }

  // Stage 5: Customer Discovery Questions
  const s5 = stages.find((s) => s.name === "customer_discovery_questions");
  if (s5 && s5.output) {
    const o = s5.output as any;
    md += `## 5. Customer Discovery Questions (The Mom Test)\n\n`;
    md += `> **Golden Rule:** Ask about past life and behavior. Never pitch the product or ask hypothetical questions.\n\n`;
    (o.themes || []).forEach((theme: any) => {
      md += `### ${theme.theme}\n_${theme.description}_\n\n`;
      (theme.questions || []).forEach((q: any, qIdx: number) => {
        md += `**Q${qIdx + 1}: ${q.question}**\n`;
        md += `* *Purpose:* ${q.purpose}\n`;
        md += `* *Follow-up Hint:* ${q.followUpHint}\n\n`;
      });
    });
    md += `---\n\n`;
  }

  // Stage 6: Business Strategies
  const s6 = stages.find((s) => s.name === "business_strategies");
  if (s6 && s6.output) {
    const o = s6.output as any;
    md += `## 6. Strategic Growth & GTM Playbooks\n\n`;
    (o.strategies || []).forEach((strat: any, idx: number) => {
      const isRec = idx === o.recommendedStrategyIndex;
      md += `### ${isRec ? "⭐ [RECOMMENDED] " : ""}${strat.title}\n\n`;
      md += `* **Positioning:** ${strat.positioning}\n`;
      md += `* **Go-To-Market Channels:** ${strat.goToMarket}\n`;
      md += `* **Pricing Model:** ${strat.pricingModel}\n`;
      md += `* **Estimated Timeline:** ${strat.timelineEstimate}\n`;
      md += `* **Day-1 MVP Scope:** ${(strat.mvpScope || []).join("; ")}\n`;
      md += `* **Pros:** ${(strat.pros || []).join(", ")}\n`;
      md += `* **Cons:** ${(strat.cons || []).join(", ")}\n`;
      md += `* **Immediate 48-Hour Step:** ${strat.firstStep}\n\n`;
    });
    md += `---\n\n`;
  }

  // Stage 7: Final Report
  const s7 = stages.find((s) => s.name === "final_report");
  if (s7 && s7.output) {
    const o = s7.output as any;
    md += `## 7. Executive Synthesis & Venture Scorecard\n\n`;
    md += `### Executive Summary\n${o.executiveSummary}\n\n`;
    if (o.ventureScorecard) {
      md += `### Venture Scorecard\n`;
      md += `* **Market Attractiveness:** ${o.ventureScorecard.marketAttractiveness} / 10\n`;
      md += `* **Solution Feasibility:** ${o.ventureScorecard.solutionFeasibility} / 10\n`;
      md += `* **Competitive Moat:** ${o.ventureScorecard.competitiveMoat} / 10\n`;
      md += `* **Overall Viability Score:** ${o.ventureScorecard.overallViability} / 10\n`;
      md += `* **Score Rationale:** ${o.ventureScorecard.rationale}\n\n`;
    }
    md += `### Key Findings\n`;
    (o.keyFindings || []).forEach((kf: string) => {
      md += `- ${kf}\n`;
    });
    md += `\n### Immediate 7-Day Tactical Action Plan\n\n`;
    (o.immediate7DayActionPlan || []).forEach((step: any) => {
      md += `* **${step.day}:** ${step.action} *(Outcome: ${step.outcome})*\n`;
    });
    md += `\n`;
  }

  md += `\n---\n*Report generated by FounderFlow AI on ${dateFormatted}.*`;
  return md;
}

export function generatePrintableHtml(report: ReportRecord): string {
  const mdContent = generateMarkdownReport(report);
  const dateFormatted = new Date(report.createdAt).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>FounderFlow AI Report - ${report.id}</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;600&display=swap');
    
    * { box-sizing: border-box; }
    body {
      font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
      line-height: 1.6;
      color: #0f172a;
      background: #f8fafc;
      padding: 40px 20px;
      margin: 0;
    }
    .container {
      max-width: 900px;
      margin: 0 auto;
      background: #ffffff;
      padding: 56px;
      border-radius: 16px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.06);
    }
    .header {
      border-bottom: 2px solid #e2e8f0;
      padding-bottom: 24px;
      margin-bottom: 32px;
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }
    .logo {
      font-size: 26px;
      font-weight: 800;
      color: #4f46e5;
      letter-spacing: -0.5px;
    }
    .badge {
      display: inline-block;
      padding: 4px 12px;
      font-size: 12px;
      font-weight: 700;
      text-transform: uppercase;
      border-radius: 9999px;
      background: #ecfdf5;
      color: #059669;
      border: 1px solid #a7f3d0;
    }
    .disclaimer {
      background: #fffbeb;
      border-left: 4px solid #f59e0b;
      padding: 12px 16px;
      font-size: 13px;
      color: #92400e;
      border-radius: 6px;
      margin: 20px 0 32px;
    }
    h1 { font-size: 28px; font-weight: 800; color: #0f172a; margin-top: 0; }
    h2 { font-size: 20px; font-weight: 700; color: #1e293b; border-bottom: 1px solid #f1f5f9; padding-bottom: 8px; margin-top: 36px; }
    h3 { font-size: 16px; font-weight: 600; color: #334155; margin-top: 20px; }
    h4 { font-size: 14px; font-weight: 600; color: #4338ca; margin-top: 14px; }
    p, li { font-size: 14px; color: #334155; }
    ul { padding-left: 20px; }
    code { font-family: 'JetBrains Mono', monospace; background: #f1f5f9; padding: 2px 6px; border-radius: 4px; font-size: 13px; }
    .card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      padding: 16px 20px;
      margin: 16px 0;
    }
    .btn-print {
      display: inline-block;
      background: #4f46e5;
      color: #ffffff;
      padding: 10px 20px;
      border-radius: 8px;
      text-decoration: none;
      font-weight: 600;
      font-size: 14px;
      cursor: pointer;
      border: none;
      margin-bottom: 24px;
    }
    @media print {
      body { background: #ffffff; padding: 0; }
      .container { box-shadow: none; padding: 0; }
      .btn-print { display: none; }
      .disclaimer { border-left-color: #64748b; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div style="text-align: right;">
      <button class="btn-print" onclick="window.print()">🖨️ Print or Save as PDF</button>
    </div>
    <div class="header">
      <div>
        <div class="logo">FounderFlow AI</div>
        <p style="margin: 4px 0 0; color: #64748b; font-size: 13px;">Automated Venture Research & Discovery Brief</p>
      </div>
      <div style="text-align: right;">
        <span class="badge">${report.status}</span>
        <div style="font-size: 12px; color: #64748b; margin-top: 6px;">${dateFormatted}</div>
      </div>
    </div>

    <div class="disclaimer">
      <strong>Notice:</strong> AI-generated research. Verify before making business decisions. All competitor and market data verified with live web searches.
    </div>

    <div class="card">
      <div style="font-size: 12px; font-weight: 700; text-transform: uppercase; color: #64748b; margin-bottom: 6px;">Validated Startup Idea</div>
      <div style="font-size: 16px; font-weight: 600; color: #0f172a;">${escapeHtml(report.idea)}</div>
      <div style="margin-top: 10px; font-size: 13px; color: #64748b;">
        <strong>Industry:</strong> ${report.industry || "N/A"} &bull; 
        <strong>Region:</strong> ${report.region || "Global"} &bull; 
        <strong>Budget:</strong> ${report.budget || "Bootstrapped"}
      </div>
    </div>

    <pre style="white-space: pre-wrap; font-family: inherit; font-size: 14px; line-height: 1.7; color: #334155;">${escapeHtml(mdContent)}</pre>
  </div>
</body>
</html>`;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

