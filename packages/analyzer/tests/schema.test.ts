import { describe, it, expect } from "vitest";
import { parseDrizzleSchema } from "../src/schema/schema-extractor";

describe("Drizzle Schema Extractor", () => {
  it("extracts all columns and relations from complex Drizzle table definitions without truncation", () => {
    const fixture = `
import { pgTable, uuid, varchar, text, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { events } from "./events";
import { users } from "./users";

export const attendeeRoleEnum = pgEnum("attendee_role", ["host", "attendee", "vip"]);

export const attendees = pgTable(
  "attendees",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    event_id: uuid("event_id")
      .references(() => events.id, { onDelete: "cascade" })
      .notNull(),
    user_id: uuid("user_id")
      .references(() => users.id, { onDelete: "cascade" }),
    nickname: varchar("nickname", { length: 100 }),
    avatar_url: text("avatar_url"),
    role: attendeeRoleEnum("role").default("attendee").notNull(),
    pin_code: varchar("pin_code", { length: 6 }),
    last_active_at: timestamp("last_active_at", { withTimezone: true }),
    created_at: timestamp("created_at").defaultNow().notNull(),
    updated_at: timestamp("updated_at").defaultNow().notNull(),
  }
);
`;

    const result = parseDrizzleSchema(
      fixture,
      "packages/database/src/schema/attendees.ts",
    );

    expect(result.tables).toHaveLength(1);
    const table = result.tables[0]!;
    expect(table.name).toBe("attendees");

    // All 10 columns must be extracted!
    expect(table.columns).toHaveLength(10);

    const colNames = table.columns.map((c) => c.name);
    expect(colNames).toEqual([
      "id",
      "event_id",
      "user_id",
      "nickname",
      "avatar_url",
      "role",
      "pin_code",
      "last_active_at",
      "created_at",
      "updated_at",
    ]);

    // Check specific column types
    const roleCol = table.columns.find((c) => c.name === "role")!;
    expect(roleCol.type).toBe("attendee_role");
    expect(roleCol.isNullable).toBe(false);

    const nicknameCol = table.columns.find((c) => c.name === "nickname")!;
    expect(nicknameCol.type).toBe("varchar(100)");

    const pinCodeCol = table.columns.find((c) => c.name === "pin_code")!;
    expect(pinCodeCol.type).toBe("varchar(6)");

    // Check relations
    expect(result.relations).toHaveLength(2);
    expect(result.relations).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          sourceTable: "attendees",
          sourceColumn: "event_id",
          targetTable: "events",
          targetColumn: "id",
          onDelete: "CASCADE",
        }),
        expect.objectContaining({
          sourceTable: "attendees",
          sourceColumn: "user_id",
          targetTable: "users",
          targetColumn: "id",
          onDelete: "CASCADE",
        }),
      ]),
    );
  });
});
