import { pgTable, varchar, text, integer, timestamp, jsonb } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const reports = pgTable("reports", {
  id: varchar("id", { length: 36 }).primaryKey(),
  userId: varchar("user_id", { length: 255 }).notNull(),
  idea: text("idea").notNull(),
  industry: varchar("industry", { length: 100 }),
  region: varchar("region", { length: 100 }),
  budget: varchar("budget", { length: 100 }),
  status: varchar("status", { length: 20 }).notNull().default("draft"), // draft | in_review | approved
  currentStageIndex: integer("current_stage_index").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const stages = pgTable("stages", {
  id: varchar("id", { length: 36 }).primaryKey(),
  reportId: varchar("report_id", { length: 36 })
    .notNull()
    .references(() => reports.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 50 }).notNull(),
  orderIndex: integer("order_index").notNull(),
  output: jsonb("output"),
  status: varchar("status", { length: 20 }).notNull().default("pending"), // pending | generating | generated | approved | error
  sources: jsonb("sources"),
  error: text("error"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const reportsRelations = relations(reports, ({ many }) => ({
  stages: many(stages),
}));

export const stagesRelations = relations(stages, ({ one }) => ({
  report: one(reports, {
    fields: [stages.reportId],
    references: [reports.id],
  }),
}));

export type Report = typeof reports.$inferSelect;
export type NewReport = typeof reports.$inferInsert;
export type Stage = typeof stages.$inferSelect;
export type NewStage = typeof stages.$inferInsert;

