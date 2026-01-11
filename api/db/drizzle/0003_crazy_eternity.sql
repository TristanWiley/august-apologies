CREATE TABLE `playlist_entries` (
	`id` integer PRIMARY KEY NOT NULL,
	`song_id` integer NOT NULL,
	`twitch_id` text NOT NULL,
	FOREIGN KEY (`song_id`) REFERENCES `songs`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_playlist_song_unique` ON `playlist_entries` (`song_id`,`twitch_id`);--> statement-breakpoint
CREATE INDEX `idx_playlist_song_idx` ON `playlist_entries` (`song_id`);--> statement-breakpoint
CREATE INDEX `idx_playlist_user_idx` ON `playlist_entries` (`twitch_id`);