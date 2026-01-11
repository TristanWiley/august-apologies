export interface SpotifyOwnership {
  [spotifyId: string]: {
    addedBy: {
      twitchId: string;
      displayName: string;
    };
  };
}
