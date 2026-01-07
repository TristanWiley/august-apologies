ALTER TABLE `accounts` ADD `subscription_type` text;--> statement-breakpoint
ALTER TABLE `accounts` ADD `is_gifted_sub` integer;--> statement-breakpoint
ALTER TABLE `accounts` DROP COLUMN `broadcaster_token`;--> statement-breakpoint
ALTER TABLE `accounts` DROP COLUMN `broadcaster_refresh_token`;--> statement-breakpoint
ALTER TABLE `accounts` DROP COLUMN `broadcaster_token_expires_at`;--> statement-breakpoint
ALTER TABLE `accounts` DROP COLUMN `spotify_owner_token`;