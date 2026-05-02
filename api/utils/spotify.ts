// Helper to convert Spotify URL to track URI
export const parseSpotifyTrackId = (input: string): string | null => {
  // Handle spotify:track:xxx format
  if (input.startsWith("spotify:track:")) {
    return input;
  }

  // Handle https://open.spotify.com/track/xxx format
  const match = input.match(/track\/([a-zA-Z0-9]+)/);
  if (match) {
    return `spotify:track:${match[1]}`;
  }

  return null;
};
