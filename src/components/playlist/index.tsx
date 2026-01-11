import React from "react";
import { Nav } from "../nav";

type Track = {
  id: string;
  name: string;
  artists: string;
  album?: string | null;
  duration_ms: number;
  external_url?: string | null;
};

type Playlist = {
  id?: string;
  name?: string;
  description?: string;
  images?: Array<{ url?: string }>;
  tracks: Track[];
};

const SkeletonTrack: React.FC<{ idx: number }> = ({ idx }) => (
  <div className="flex items-center gap-4 animate-pulse">
    <div className="w-6 text-right text-sm text-slate-400">{idx + 1}</div>
    <div className="flex-1">
      <div className="h-4 bg-slate-700 rounded w-3/4" />
      <div className="h-3 bg-slate-700 rounded mt-2 w-1/2" />
    </div>
    <div className="h-4 w-12 bg-slate-700 rounded" />
    <div className="h-6 w-16 bg-slate-700 rounded" />
  </div>
);

export interface SpotifyOwnership {
  [spotifyId: string]: {
    addedBy: {
      twitchId: string;
      displayName: string;
    };
  };
}

export interface SpotifyOwnershipResponse {
  ownership: SpotifyOwnership;
  cached: boolean;
}

export const PlaylistPage: React.FC = () => {
  const [loading, setLoading] = React.useState(true);
  const [playlist, setPlaylist] = React.useState<Playlist | null>(null);
  const [ownership, setOwnership] = React.useState<SpotifyOwnership | null>(
    null
  );
  const [error, setError] = React.useState<string | null>(null);

  const [, setIsSubscriber] = React.useState(false);
  // const [addingUri, setAddingUri] = React.useState("");
  const sessionId =
    typeof window !== "undefined"
      ? localStorage.getItem("august-session-id")
      : null;

  // Confirmation modal state for removing tracks
  const [confirmingTrack, setConfirmingTrack] = React.useState<Track | null>(
    null
  );
  const [confirmLoading, setConfirmLoading] = React.useState(false);

  React.useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const res = await fetch("/api/spotify/playlist");
        if (!res.ok) throw new Error("Failed to load playlist");
        const data = (await res.json()) as Playlist;
        if (!mounted) return;
        setPlaylist(data);
      } catch (err: unknown) {
        console.error(err);
        if (!mounted) return;
        const message = err instanceof Error ? err.message : String(err);
        setError(message || "Error");
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    (async () => {
      try {
        const res = await fetch("/api/spotify/ownership");
        if (!res.ok) throw new Error("Failed to fetch ownership data");
        const data = (await res.json()) as SpotifyOwnershipResponse;
        if (!mounted) return;
        setOwnership(data.ownership);
      } catch (err: unknown) {
        console.error(err);
        if (!mounted) return;
        const message = err instanceof Error ? err.message : String(err);
        console.error("Ownership fetch error:", message);
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    // fetch account data if sessionId exists
    (async () => {
      if (!sessionId) return;
      try {
        const res = await fetch(`/api/accounts/session?sessionId=${sessionId}`);
        if (!res.ok) return;
        const json = await res.json();
        if (!mounted) return;
        setIsSubscriber(Boolean(json.account?.is_subscriber));
      } catch (err) {
        console.warn("Failed to fetch account info", err);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [sessionId]);

  const handleConfirmRemove = async () => {
    if (!confirmingTrack) return;
    setConfirmLoading(true);
    try {
      const res = await fetch(`/api/spotify/playlist/remove`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, trackUri: confirmingTrack.id }),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.message || "Failed to remove track");
      }

      setPlaylist((p) =>
        p
          ? {
              ...p,
              tracks: p.tracks.filter((x) => x.id !== confirmingTrack.id),
            }
          : p
      );
      setConfirmingTrack(null);
    } catch (err) {
      console.error(err);
      alert(err instanceof Error ? err.message : String(err));
    } finally {
      setConfirmLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col items-center gap-6 px-4">
      <Nav />

      <main className="w-full max-w-4xl mt-4">
        <div className="flex gap-4 items-center">
          {playlist?.images?.[0] ? (
            <img
              src={playlist.images[0].url}
              className="w-28 h-28 rounded"
              alt="playlist"
            />
          ) : (
            <div className="w-28 h-28 rounded bg-slate-700" />
          )}

          <div>
            <h2 className="text-2xl font-bold">
              {playlist?.name ?? "Community Playlist"}
            </h2>
            {playlist?.description ? (
              <p className="text-sm text-slate-300 mt-1">
                {playlist.description}
              </p>
            ) : null}
            {playlist?.id ? (
              <a
                href={`https://open.spotify.com/playlist/${playlist.id}`}
                target="_blank"
                rel="noreferrer"
                className="text-sm text-[#1DB954] mt-2 inline-block"
              >
                Open in Spotify
              </a>
            ) : null}
          </div>
        </div>

        <div className="mt-6">
          {/* compute content to avoid nested ternaries */}
          {(() => {
            if (loading) {
              return (
                <ul className="flex flex-col gap-3">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <li key={i} className="py-2">
                      <SkeletonTrack idx={i} />
                    </li>
                  ))}
                </ul>
              );
            }

            if (error) {
              return (
                <div className="flex items-center justify-center h-48">
                  <p className="text-xl text-red-500">{error}</p>
                </div>
              );
            }

            if (playlist && playlist.tracks.length > 0) {
              return (
                <>
                  <ul className="flex flex-col gap-3">
                    {playlist.tracks.map((t: Track, idx: number) => {
                      const ownerName = ownership?.[t.id]?.addedBy.displayName;
                      if (ownership) {
                        console.log(
                          t.id,
                          ownership,
                          ownership["spotify:track:4b7qa1hR0fFmoFTA77cgEm"]
                        );
                      }
                      return (
                        <li
                          key={t.id || idx}
                          className="flex items-center gap-4"
                        >
                          <div className="w-6 text-right text-sm text-slate-300">
                            {idx + 1}
                          </div>
                          <div className="flex-1">
                            <div className="font-medium">
                              {t.name}
                              {ownerName ? (
                                // Highlight the owner name
                                <span className="text-amber-400">
                                  {" "}
                                  added by {ownerName}
                                </span>
                              ) : (
                                ""
                              )}
                            </div>
                            <div className="text-sm text-slate-400">
                              {t.artists} • {t.album}
                            </div>
                          </div>
                          <div className="text-sm text-slate-300 mr-4">
                            {Math.floor(t.duration_ms / 1000 / 60)}:
                            {String(
                              Math.floor((t.duration_ms / 1000) % 60)
                            ).padStart(2, "0")}
                          </div>

                          {t.external_url ? (
                            <a
                              href={t.external_url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-sm text-[#1DB954]"
                            >
                              Listen
                            </a>
                          ) : null}

                          {/* {isSubscriber ? (
                          <button
                            onClick={() => setConfirmingTrack(t)}
                            className="ml-4 text-sm text-red-400"
                          >
                            Remove
                          </button>
                        ) : null} */}
                        </li>
                      );
                    })}
                  </ul>

                  {/* {isSubscriber ? (
                    <div className="mt-4 flex items-center gap-2">
                      <input
                        value={addingUri}
                        onChange={(e) => setAddingUri(e.target.value)}
                        placeholder="spotify:track:... or https://open.spotify.com/track/..."
                        className="bg-slate-900/40 px-2 py-1 rounded flex-1"
                      />
                      <button
                        onClick={async () => {
                          if (!addingUri) return;
                          try {
                            const res = await fetch(
                              `/api/spotify/playlist/add`,
                              {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({
                                  sessionId,
                                  trackUri: addingUri,
                                }),
                              }
                            );
                            if (!res.ok) {
                              const json = await res.json();
                              throw new Error(
                                json.message || "Failed to add track"
                              );
                            }
                            // Refresh playlist
                            const refreshed = await fetch(
                              "/api/spotify/playlist"
                            );
                            if (refreshed.ok) {
                              const data = await refreshed.json();
                              setPlaylist(data);
                              setAddingUri("");
                            }
                          } catch (err) {
                            console.error(err);
                            const msg =
                              err instanceof Error ? err.message : String(err);
                            alert(msg || "Failed to add track");
                          }
                        }}
                        className="bg-[#1DB954] text-black px-3 py-1 rounded"
                      >
                        Add
                      </button>
                    </div>
                  ) : null} */}
                </>
              );
            }

            return (
              <div className="flex items-center justify-center h-48">
                <p className="text-xl">No tracks found.</p>
              </div>
            );
          })()}
        </div>
      </main>

      {/* Confirmation modal for removals */}
      {confirmingTrack ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-slate-900 p-6 rounded shadow-lg w-full max-w-md">
            <h3 className="text-lg font-semibold">Remove track?</h3>
            <p className="text-sm text-slate-300 mt-2">
              Remove "{confirmingTrack.name}" by {confirmingTrack.artists} from
              the playlist? This cannot be undone here; you can re-add the track
              if needed.
            </p>

            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => setConfirmingTrack(null)}
                className="px-3 py-1 rounded bg-slate-800 text-sm"
                disabled={confirmLoading}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmRemove}
                className="px-3 py-1 rounded bg-red-500 text-white"
                disabled={confirmLoading}
              >
                {confirmLoading ? "Removing…" : "Remove"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};
