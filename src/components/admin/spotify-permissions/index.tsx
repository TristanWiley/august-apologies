import { useCallback, useEffect, useState } from "react";

export const SpotifyPermissions: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [info, setInfo] = useState<boolean>(false);

  const originName = window.location.origin;
  const redirectURL = `${originName}/spotify-callback`;
  const spotifyClientID = "281ecdc6defb4bfbb81374964b824e71";

  const scopes = [
    "user-modify-playback-state",
    "user-read-playback-state",
    "user-read-currently-playing",
  ].join(" ");

  const spotifyAuthURL = `https://accounts.spotify.com/authorize?response_type=code&client_id=${spotifyClientID}&redirect_uri=${encodeURIComponent(
    redirectURL,
  )}&scope=${encodeURIComponent(scopes)}&state=admin_spotify_permissions`;

  const fetchInfo = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/spotify/info`);
      if (res.ok) {
        const { data } = await res.json();
        setInfo(data);
      } else {
        setInfo(false);
      }
    } catch (err) {
      console.warn(err);
      setInfo(false);
    }
  }, []);

  useEffect(() => {
    fetchInfo();
  }, [fetchInfo]);

  useEffect(() => {
    const handler = async (event: StorageEvent) => {
      if (event.key === "august-admin-spotify-code" && event.newValue) {
        setLoading(true);
        try {
          const res = await fetch(`/api/admin/spotify/callback`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              code: event.newValue,
              redirectURL,
              sessionId: localStorage.getItem("august-session-id"),
            }),
          });

          if (!res.ok) {
            console.error("Failed to process admin spotify callback");
          } else {
            await fetchInfo();
          }
        } catch (err) {
          console.error(err);
        } finally {
          setLoading(false);
        }
      }
    };

    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, [fetchInfo, redirectURL]);

  return (
    <div className="p-6">
      <h3 className="text-xl font-bold">Grant Spotify permissions</h3>

      <div className="mt-4 p-4 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-900 shadow-sm">
        <p className="text-sm text-gray-200 mb-3">
          Hey August, this will give the site permissions to do a few things:
        </p>
        <ul className="list-disc list-inside">
          <li>Control playback (play/pause/skip/volume/etc)</li>
          <li>Read what's currently playing</li>
        </ul>
        <p className="text-sm text-gray-200">
          Once you authorize, the site will handle the rest.
        </p>

        <button
          onClick={() => window.open(spotifyAuthURL, "_blank")}
          className="bg-[#6441a5] text-white px-4 py-2 rounded-md hover:bg-[#4b2f83] transition"
        >
          Grant Spotify permissions
        </button>

        <div className="mt-4">
          <h4 className="font-semibold">
            {info ? "Tokens stored" : "No tokens stored"}
          </h4>
        </div>

        {loading && <div className="mt-4 text-sm">Processing...</div>}
      </div>
    </div>
  );
};
