CREATE TABLE `songs` (
	`id` integer PRIMARY KEY NOT NULL,
	`spotify_id` text NOT NULL,
	`title` text NOT NULL,
	`artist` text NOT NULL,
	`album` text NOT NULL,
	`duration_ms` integer NOT NULL,
	`added_by_twitch_id` text NOT NULL,
	`added_at` integer DEFAULT (unixepoch() * 1000) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `songs_spotify_id_unique` ON `songs` (`spotify_id`);