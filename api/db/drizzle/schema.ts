import { sql } from "drizzle-orm";
import { sqliteTable, integer, text } from "drizzle-orm/sqlite-core";

const timestampDefault = sql`(unixepoch() * 1000)`;

export const apologies = sqliteTable("apologies", {
  id: integer().primaryKey(),
  twitch_id: text().notNull().unique(),
  twitch_username: text().notNull(),
  subject: text(),
  apology_text: text(),
  session_id: text(),
});

export const accounts = sqliteTable("accounts", {
  id: integer().primaryKey(),
  twitch_id: text().notNull().unique(),
  display_name: text().notNull(),
  session_id: text().notNull(),
  is_subscriber: integer().default(0),
  is_owner: integer().default(0),
  subscription_type: text(),
  is_gifted_sub: integer({ mode: "boolean" }),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(timestampDefault),
});

export const songs = sqliteTable("songs", {
  id: integer().primaryKey(),
  spotify_id: text().notNull().unique(),
  title: text().notNull(),
  artist: text().notNull(),
  album: text().notNull(),
  duration_ms: integer().notNull(),
  added_by_twitch_id: text().notNull(),
  added_at: integer("added_at", { mode: "timestamp" })
    .notNull()
    .default(timestampDefault),
});
