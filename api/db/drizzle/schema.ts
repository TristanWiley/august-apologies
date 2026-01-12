import { sql } from "drizzle-orm";
import {
  sqliteTable,
  integer,
  text,
  uniqueIndex,
  index,
} from "drizzle-orm/sqlite-core";

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
  is_banned: integer({ mode: "boolean" }).default(false),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(timestampDefault),
});

// Not used for now
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

export const playlistEntries = sqliteTable(
  "playlist_entries",
  {
    id: integer().primaryKey(),
    song_id: text().notNull(),
    twitch_id: text().notNull(),
  },
  (table) => [
    uniqueIndex("idx_playlist_song_unique").on(table.song_id, table.twitch_id),
    index("idx_playlist_song_idx").on(table.song_id),
    index("idx_playlist_user_idx").on(table.twitch_id),
  ]
);
