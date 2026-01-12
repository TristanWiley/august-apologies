CREATE TABLE `pending_songs` (
	`id` integer PRIMARY KEY NOT NULL,
	`spotify_id` text NOT NULL,
	`track_name` text NOT NULL,
	`track_artists` text NOT NULL,
	`track_album` text,
	`track_duration_ms` integer NOT NULL,
	`external_url` text,
	`added_by_twitch_id` text NOT NULL,
	`added_by_display_name` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `pending_songs_spotify_id_unique` ON `pending_songs` (`spotify_id`);--> statement-breakpoint
CREATE INDEX `idx_pending_songs_added_by` ON `pending_songs` (`added_by_twitch_id`);--> statement-breakpoint
ALTER TABLE `accounts` ADD `is_trusted` integer DEFAULT false;