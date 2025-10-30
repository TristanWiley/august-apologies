PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_apologies` (
	`id` integer PRIMARY KEY NOT NULL,
	`twitch_id` text NOT NULL,
	`twitch_username` text NOT NULL,
	`subject` text,
	`apology_text` text,
	`session_id` text
);
--> statement-breakpoint
INSERT INTO `__new_apologies`("id", "twitch_id", "twitch_username", "subject", "apology_text", "session_id") SELECT "id", "twitch_id", "twitch_username", "subject", "apology_text", "session_id" FROM `apologies`;--> statement-breakpoint
DROP TABLE `apologies`;--> statement-breakpoint
ALTER TABLE `__new_apologies` RENAME TO `apologies`;--> statement-breakpoint
PRAGMA foreign_keys=ON;