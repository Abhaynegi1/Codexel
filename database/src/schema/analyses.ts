import { pgTable, uuid, varchar, timestamp, pgEnum, jsonb } from "drizzle-orm/pg-core";
import { repositories } from "./repositories";
import type { RepositoryModel, AnalysisExecutionStats } from "@codexel/shared";

export const analysisStatusEnum = pgEnum("analysis_status", [
  "pending",
  "analyzing",
  "completed",
  "failed",
]);

export const analyses = pgTable("analyses", {
  id: uuid("id").defaultRandom().primaryKey(),
  repositoryId: uuid("repository_id")
    .references(() => repositories.id, { onDelete: "cascade" })
    .notNull(),
  commitSha: varchar("commit_sha", { length: 64 }).notNull(),
  status: analysisStatusEnum("status").default("pending").notNull(),
  analyzerVersion: varchar("analyzer_version", { length: 32 }).notNull(),
  summary: jsonb("summary"),
  modelPayload: jsonb("model_payload").$type<RepositoryModel>(),
  stats: jsonb("stats").$type<AnalysisExecutionStats>(),
  errorDetails: jsonb("error_details").$type<{
    code?: string;
    message?: string;
    stack?: string;
  }>(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export type Analysis = typeof analyses.$inferSelect;
export type NewAnalysis = typeof analyses.$inferInsert;
