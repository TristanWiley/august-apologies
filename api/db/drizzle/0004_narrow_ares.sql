PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_playlist_entries` (
	`id` integer PRIMARY KEY NOT NULL,
	`song_id` text NOT NULL,
	`twitch_id` text NOT NULL,
	FOREIGN KEY (`song_id`) REFERENCES `songs`(`spotify_id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_playlist_entries`("id", "song_id", "twitch_id") SELECT "id", "song_id", "twitch_id" FROM `playlist_entries`;--> statement-breakpoint
DROP TABLE `playlist_entries`;--> statement-breakpoint
ALTER TABLE `__new_playlist_entries` RENAME TO `playlist_entries`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE UNIQUE INDEX `idx_playlist_song_unique` ON `playlist_entries` (`song_id`,`twitch_id`);--> statement-breakpoint
CREATE INDEX `idx_playlist_song_idx` ON `playlist_entries` (`song_id`);--> statement-breakpoint
CREATE INDEX `idx_playlist_user_idx` ON `playlist_entries` (`twitch_id`);
INSERT INTO
    `accounts` (`twitch_id`, `display_name`, `session_id`)
VALUES
    ('491771822', 'keetybat', ''),
    ('223991359', 'neptunelyy', ''),
    ('255749764', 'nikifoos', ''),
    ('25675896', 'twiii_', ''),
    ('413598142', 'chaotic_neutra1_', ''),
    ('92696756', 'ospleen', ''),
    ('103843027', 'mythicalturtle_', ''),
    ('687644667', 'four_testing_12', ''),
    ('488326409', 'briebeihl', ''),
    ('183988977', 'uwuivy', ''),
    ('167834053', 'opticalspxtre', ''),
    ('67294587', 'lunarwraith23', ''),
    ('709030905', 'noeliasalome', ''),
    ('196130235', 'kitana80085', ''),
    ('110449406', 'lernaia', ''),
    ('73829569', 'vkmgl', ''),
    ('439662811', 'wRoussil', ''),
    ('465061384', 'telosie', ''),
    ('599499282', 'alexis_idrk', ''),
    ('189854672', 'autobot0', ''),
    ('45062570', 'uhh_khost', ''),
    ('138511165', 'itsjustvezz', ''),
    ('183519486', 'gotdamitbobbi', ''),
    ('68021789', 'gummybunny', ''),
    ('176207361', 'looking4frogs', ''),
    ('770299912', 'ren_0212', '');