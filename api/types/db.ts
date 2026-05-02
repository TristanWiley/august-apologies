import z from "zod";

export const SpotifyOwnershipSchema = z.record(
  z.string(),
  z.object({
    addedBy: z.object({
      twitchId: z.string(),
      displayName: z.string(),
    }),
  }),
);

export type SpotifyOwnership = z.infer<typeof SpotifyOwnershipSchema>;
