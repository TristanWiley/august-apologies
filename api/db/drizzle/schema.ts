import { sqliteTable, integer, text } from "drizzle-orm/sqlite-core";

export const apologies = sqliteTable("apologies", {
  id: integer().primaryKey(),
  twitch_id: text().notNull(),
  twitch_username: text().notNull(),
  subject: text(),
  apology_text: text(),
  session_id: text(),
});
