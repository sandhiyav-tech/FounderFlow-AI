import { drizzle } from "drizzle-orm/neon-http";
import { neon, neonConfig } from "@neondatabase/serverless";
import * as schema from "./schema";
import { eq, desc } from "drizzle-orm";
import type { ReportRecord, StageRecord, StageName, StageStatus, ReportStatus, SourceLink } from "@/types";
import fs from "fs";
import path from "path";

// Initialize Neon Drizzle connection if DATABASE_URL is available
const databaseUrl = process.env.DATABASE_URL;

function initDb() {
  if (databaseUrl && !databaseUrl.includes("user:password@ep-sample")) {
    try {
      neonConfig.fetchConnectionCache = true;
      const sql = neon(databaseUrl);
      return drizzle(sql, { schema });
    } catch (err) {
      console.warn("[DB] Failed to initialize Neon database client:", err);
    }
  }
  return null;
}

export const db = initDb();

// Fallback in-memory / file-based storage for local dev or when Neon is not yet configured
interface LocalDbStore {
  reports: Record<string, ReportRecord>;
}

const LOCAL_STORE_FILE = path.join(process.cwd(), ".founderflow_local_db.json");

function readLocalStore(): LocalDbStore {
  try {
    if (fs.existsSync(LOCAL_STORE_FILE)) {
      const data = fs.readFileSync(LOCAL_STORE_FILE, "utf-8");
      return JSON.parse(data);
    }
  } catch {
    // ignore
  }
  return { reports: {} };
}

function writeLocalStore(store: LocalDbStore) {
  try {
    fs.writeFileSync(LOCAL_STORE_FILE, JSON.stringify(store, null, 2), "utf-8");
  } catch {
    // ignore in serverless read-only filesystem
  }
}

// In-memory fallback if file write fails (e.g. on Vercel lambda without DB)
const memoryStore: LocalDbStore = { reports: {} };

// Unified Repository Interface
export const reportRepository = {
  async createReport(params: {
    id: string;
    userId: string;
    idea: string;
    industry?: string;
    region?: string;
    budget?: string;
    initialStages: Array<{
      id: string;
      name: StageName;
      orderIndex: number;
    }>;
  }): Promise<ReportRecord> {
    const now = new Date();
    const nowIso = now.toISOString();

    if (db) {
      try {
        await db.insert(schema.reports).values({
          id: params.id,
          userId: params.userId,
          idea: params.idea,
          industry: params.industry || null,
          region: params.region || null,
          budget: params.budget || null,
          status: "draft",
          currentStageIndex: 0,
          createdAt: now,
          updatedAt: now,
        });

        for (const stage of params.initialStages) {
          await db.insert(schema.stages).values({
            id: stage.id,
            reportId: params.id,
            name: stage.name,
            orderIndex: stage.orderIndex,
            status: "pending",
            output: null,
            sources: null,
            error: null,
            updatedAt: now,
          });
        }

        const stagesList: StageRecord[] = params.initialStages.map((s) => ({
          id: s.id,
          reportId: params.id,
          name: s.name,
          orderIndex: s.orderIndex,
          status: "pending",
          output: null,
          sources: null,
          updatedAt: nowIso,
        }));

        return {
          id: params.id,
          userId: params.userId,
          idea: params.idea,
          industry: params.industry,
          region: params.region,
          budget: params.budget,
          status: "draft",
          currentStageIndex: 0,
          createdAt: nowIso,
          updatedAt: nowIso,
          stages: stagesList,
        };
      } catch (err) {
        console.warn("[DB] Neon insert failed, using fallback store:", err);
      }
    }

    // Local / Memory fallback
    const stagesList: StageRecord[] = params.initialStages.map((s) => ({
      id: s.id,
      reportId: params.id,
      name: s.name,
      orderIndex: s.orderIndex,
      status: "pending",
      output: null,
      sources: null,
      updatedAt: nowIso,
    }));

    const report: ReportRecord = {
      id: params.id,
      userId: params.userId,
      idea: params.idea,
      industry: params.industry,
      region: params.region,
      budget: params.budget,
      status: "draft",
      currentStageIndex: 0,
      createdAt: nowIso,
      updatedAt: nowIso,
      stages: stagesList,
    };

    const store = readLocalStore();
    store.reports[params.id] = report;
    memoryStore.reports[params.id] = report;
    writeLocalStore(store);

    return report;
  },

  async getReport(id: string): Promise<ReportRecord | null> {
    if (db) {
      try {
        const found = await db.query.reports.findFirst({
          where: eq(schema.reports.id, id),
          with: {
            stages: {
              orderBy: (stages, { asc }) => [asc(stages.orderIndex)],
            },
          },
        });

        if (found) {
          return {
            id: found.id,
            userId: found.userId,
            idea: found.idea,
            industry: found.industry,
            region: found.region,
            budget: found.budget,
            status: found.status as ReportStatus,
            currentStageIndex: found.currentStageIndex,
            createdAt: found.createdAt.toISOString(),
            updatedAt: found.updatedAt.toISOString(),
            stages: found.stages.map((s) => ({
              id: s.id,
              reportId: s.reportId,
              name: s.name as StageName,
              orderIndex: s.orderIndex,
              status: s.status as StageStatus,
              output: s.output as any,
              sources: (s.sources as SourceLink[]) || null,
              error: s.error,
              updatedAt: s.updatedAt.toISOString(),
            })),
          };
        }
      } catch (err) {
        console.warn("[DB] Neon getReport failed, checking fallback:", err);
      }
    }

    const store = readLocalStore();
    return store.reports[id] || memoryStore.reports[id] || null;
  },

  async listReports(userId?: string): Promise<ReportRecord[]> {
    if (db) {
      try {
        const query = userId
          ? db.query.reports.findMany({
            where: eq(schema.reports.userId, userId),
            orderBy: [desc(schema.reports.updatedAt)],
            with: {
              stages: {
                orderBy: (stages, { asc }) => [asc(stages.orderIndex)],
              },
            },
          })
          : db.query.reports.findMany({
            orderBy: [desc(schema.reports.updatedAt)],
            with: {
              stages: {
                orderBy: (stages, { asc }) => [asc(stages.orderIndex)],
              },
            },
          });

        const records = await query;
        return records.map((r) => ({
          id: r.id,
          userId: r.userId,
          idea: r.idea,
          industry: r.industry,
          region: r.region,
          budget: r.budget,
          status: r.status as ReportStatus,
          currentStageIndex: r.currentStageIndex,
          createdAt: r.createdAt.toISOString(),
          updatedAt: r.updatedAt.toISOString(),
          stages: r.stages.map((s) => ({
            id: s.id,
            reportId: s.reportId,
            name: s.name as StageName,
            orderIndex: s.orderIndex,
            status: s.status as StageStatus,
            output: s.output as any,
            sources: (s.sources as SourceLink[]) || null,
            error: s.error,
            updatedAt: s.updatedAt.toISOString(),
          })),
        }));
      } catch (err) {
        console.warn("[DB] Neon listReports failed, checking fallback:", err);
      }
    }

    const store = readLocalStore();
    const all = { ...memoryStore.reports, ...store.reports };
    const list = Object.values(all);
    if (userId) {
      return list.filter((r) => r.userId === userId).sort((a, b) => (b.updatedAt > a.updatedAt ? 1 : -1));
    }
    return list.sort((a, b) => (b.updatedAt > a.updatedAt ? 1 : -1));
  },

  async updateStage(params: {
    reportId: string;
    stageName: StageName;
    output?: any;
    status?: StageStatus;
    sources?: SourceLink[];
    error?: string | null;
  }): Promise<void> {
    const now = new Date();

    if (db) {
      try {
        const updateValues: Record<string, any> = { updatedAt: now };
        if (params.output !== undefined) updateValues.output = params.output;
        if (params.status !== undefined) updateValues.status = params.status;
        if (params.sources !== undefined) updateValues.sources = params.sources;
        if (params.error !== undefined) updateValues.error = params.error;

        const currentStage = await db.query.stages.findFirst({
          where: (stages, { and, eq }) =>
            and(eq(stages.reportId, params.reportId), eq(stages.name, params.stageName)),
        });

        if (currentStage) {
          await db
            .update(schema.stages)
            .set(updateValues)
            .where(eq(schema.stages.id, currentStage.id));

          await db
            .update(schema.reports)
            .set({ updatedAt: now })
            .where(eq(schema.reports.id, params.reportId));

          return;
        }
      } catch (err) {
        console.warn("[DB] Neon updateStage failed, falling back:", err);
      }
    }

    // Fallback store update
    const store = readLocalStore();
    const report = store.reports[params.reportId] || memoryStore.reports[params.reportId];
    if (report && report.stages) {
      const stage = report.stages.find((s) => s.name === params.stageName);
      if (stage) {
        if (params.output !== undefined) stage.output = params.output;
        if (params.status !== undefined) stage.status = params.status;
        if (params.sources !== undefined) stage.sources = params.sources;
        if (params.error !== undefined) stage.error = params.error;
        stage.updatedAt = now.toISOString();
        report.updatedAt = now.toISOString();
        store.reports[params.reportId] = report;
        memoryStore.reports[params.reportId] = report;
        writeLocalStore(store);
      }
    }
  },

  async updateReportStatus(params: {
    reportId: string;
    status: ReportStatus;
    currentStageIndex?: number;
  }): Promise<void> {
    const now = new Date();

    if (db) {
      try {
        const updateValues: Record<string, any> = {
          status: params.status,
          updatedAt: now,
        };
        if (params.currentStageIndex !== undefined) {
          updateValues.currentStageIndex = params.currentStageIndex;
        }

        await db
          .update(schema.reports)
          .set(updateValues)
          .where(eq(schema.reports.id, params.reportId));

        return;
      } catch (err) {
        console.warn("[DB] Neon updateReportStatus failed, falling back:", err);
      }
    }

    const store = readLocalStore();
    const report = store.reports[params.reportId] || memoryStore.reports[params.reportId];
    if (report) {
      report.status = params.status;
      if (params.currentStageIndex !== undefined) {
        report.currentStageIndex = params.currentStageIndex;
      }
      report.updatedAt = now.toISOString();
      store.reports[params.reportId] = report;
      memoryStore.reports[params.reportId] = report;
      writeLocalStore(store);
    }
  },

  async deleteReport(id: string): Promise<void> {
    if (db) {
      try {
        await db.delete(schema.reports).where(eq(schema.reports.id, id));
        return;
      } catch (err) {
        console.warn("[DB] Neon deleteReport failed:", err);
      }
    }

    const store = readLocalStore();
    delete store.reports[id];
    delete memoryStore.reports[id];
    writeLocalStore(store);
  },
};
