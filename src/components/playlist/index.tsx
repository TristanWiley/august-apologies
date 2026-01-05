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

export const PlaylistPage: React.FC = () => {
  const [loading, setLoading] = React.useState(true);
  const [playlist, setPlaylist] = React.useState<Playlist | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  // Pagination state
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(10);

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

    return () => {
      mounted = false;
    };
  }, []);

  // Reset to first page when playlist or page size changes
  React.useEffect(() => setPage(1), [playlist, pageSize]);

  const totalPages = playlist && playlist.tracks ? Math.max(1, Math.ceil(playlist.tracks.length / pageSize)) : 1;
  const paginated = playlist ? playlist.tracks.slice((page - 1) * pageSize, page * pageSize) : [];

  const pageWindow = (() => {
    const max = 7;
    const pages: number[] = [];
    let start = Math.max(1, page - Math.floor(max / 2));
    let end = Math.min(totalPages, start + max - 1);
    if (end - start + 1 < max) start = Math.max(1, end - max + 1);
    for (let i = start; i <= end; i++) pages.push(i);
    return { pages, start, end };
  })();

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
          {loading ? (
            <ul className="flex flex-col gap-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <li key={i} className="py-2">
                  <SkeletonTrack idx={i} />
                </li>
              ))}
            </ul>
          ) : error ? (
            <div className="flex items-center justify-center h-48">
              <p className="text-xl text-red-500">{error}</p>
            </div>
          ) : playlist && playlist.tracks.length > 0 ? (
            <ul className="flex flex-col gap-3">
              {playlist.tracks.map((t: Track, idx: number) => (
                <li key={t.id || idx} className="flex items-center gap-4">
                  <div className="w-6 text-right text-sm text-slate-300">
                    {idx + 1}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium">{t.name}</div>
                    <div className="text-sm text-slate-400">
                      {t.artists} • {t.album}
                    </div>
                  </div>
                  <div className="text-sm text-slate-300 mr-4">
                    {Math.floor(t.duration_ms / 1000 / 60)}:
                    {String(Math.floor((t.duration_ms / 1000) % 60)).padStart(
                      2,
                      "0"
                    )}
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
                </li>
              ))}
            </ul>
          ) : (
            <div className="flex items-center justify-center h-48">
              <p className="text-xl">No tracks found.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};
