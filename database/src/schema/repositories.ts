import { pgTable, uuid, varchar, boolean, timestamp } from "drizzle-orm/pg-core";

export const repositories = pgTable("repositories", {
  id: uuid("id").defaultRandom().primaryKey(),
  url: varchar("url", { length: 512 }).notNull().unique(),
  owner: varchar("owner", { length: 256 }).notNull(),
  name: varchar("name", { length: 256 }).notNull(),
  defaultBranch: varchar("default_branch", { length: 128 }).default("main").notNull(),
  isPrivate: boolean("is_private").default(false).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export type Repository = typeof repositories.$inferSelect;
export type NewRepository = typeof repositories.$inferInsert;
