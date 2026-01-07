CREATE TABLE `accounts` (
	`id` integer PRIMARY KEY NOT NULL,
	`twitch_id` text NOT NULL,
	`display_name` text NOT NULL,
	`session_id` text NOT NULL,
	`is_subscriber` integer DEFAULT 0,
	`is_owner` integer DEFAULT 0,
	`broadcaster_token` text,
	`broadcaster_refresh_token` text,
	`broadcaster_token_expires_at` text,
	`spotify_owner_token` text,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `accounts_twitch_id_unique` ON `accounts` (`twitch_id`);--> statement-breakpoint
CREATE TABLE `apologies` (
	`id` integer PRIMARY KEY NOT NULL,
	`twitch_id` text NOT NULL,
	`twitch_username` text NOT NULL,
	`subject` text,
	`apology_text` text,
	`session_id` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `apologies_twitch_id_unique` ON `apologies` (`twitch_id`);