import { useCallback, useEffect, useState } from "react";

export const SpotifyPermissions: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [info, setInfo] = useState<Record<string, unknown> | null>(null);

  const originName = window.location.origin;
  const redirectURL = `${originName}/admin/spotify-callback`;
  const spotifyClientID = "your_spotify_client_id";

  // Scopes required — tweak as needed
  const scopes = [
    "channel:read:subscriptions",
    "moderation:read",
    "channel:manage:redemptions",
  ].join(" ");

  const spotifyAuthURL = `https://accounts.spotify.com/authorize?response_type=code&client_id=${spotifyClientID}&redirect_uri=${encodeURIComponent(
    redirectURL,
  )}&scope=${encodeURIComponent(scopes)}&force_verify=true`;

  const fetchInfo = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/spotify/info`);
      if (res.ok) {
        const { data } = await res.json();
        setInfo(data);
      } else {
        setInfo(null);
      }
    } catch (err) {
      console.warn(err);
      setInfo(null);
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
            body: JSON.stringify({ code: event.newValue, redirectURL }),
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
          <li>Check if users are subscribers</li>
          <li>Get updates when someone subscribes</li>
          <li>Manage channel point redemptions (future stuff)</li>
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
          <h4 className="font-semibold">Stored info</h4>
          {info ? (
            <div className="mt-2 text-sm">
              <div>
                <strong>Broadcaster:</strong>{" "}
                {typeof info.display_name === "string"
                  ? info.display_name
                  : "n/a"}{" "}
                {typeof info.id === "string" ? `(${info.id})` : ""}
              </div>
              <div>
                <strong>Scopes:</strong>{" "}
                {Array.isArray(info.scope)
                  ? (info.scope as string[]).join(", ")
                  : "n/a"}
              </div>
              <div>
                <strong>Stored:</strong>{" "}
                {typeof info.obtained_at === "number"
                  ? new Date(info.obtained_at).toLocaleString()
                  : "n/a"}
              </div>
            </div>
          ) : (
            <div className="mt-2 text-sm text-gray-500">No stored tokens</div>
          )}
        </div>

        {loading && <div className="mt-4 text-sm">Processing...</div>}
      </div>
    </div>
  );
};
