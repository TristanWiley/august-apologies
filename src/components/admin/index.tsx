import { TwitchPermissions } from "./twitch-permissions";
import { BanManager } from "./ban-manager";
import { CacheManager } from "./cache-manager";
import { TrustedUserManager } from "./trusted-user-manager";
import { SpotifyPermissions } from "./spotify-permissions";
import { useState, useEffect } from "react";

const ADMIN_STATUS_CACHE_PREFIX = "august-admin-status:";

export const AdminPage = () => {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  useEffect(() => {
    const checkAdmin = async () => {
      try {
        const sessionId = localStorage.getItem("august-session-id");
        if (!sessionId) {
          setIsAdmin(false);
          return;
        }

        const cacheKey = `${ADMIN_STATUS_CACHE_PREFIX}${sessionId}`;
        const cached = localStorage.getItem(cacheKey);
        if (cached === "true" || cached === "false") {
          setIsAdmin(cached === "true");
          return;
        }

        const res = await fetch(
          `/api/admin/is-admin?sessionId=${encodeURIComponent(sessionId)}`,
        );
        if (!res.ok) throw new Error("Failed to check admin status");
        const data = await res.json();
        const adminStatus = data.isAdmin === true;
        setIsAdmin(adminStatus);
        localStorage.setItem(cacheKey, adminStatus ? "true" : "false");
      } catch (err) {
        console.error(err);
        setIsAdmin(false);
      }
    };

    checkAdmin();
  }, []);

  if (isAdmin === null) {
    return (
      <div className="flex items-center justify-center h-full flex-col gap-4 px-4">
        <div className="w-full max-w-3xl flex items-center justify-center">
          <p className="text-xl">Checking admin status…</p>
          <img
            src="/augRiot.webp"
            alt="Loading"
            className="w-8 h-8 ml-4 animate-spin"
          />
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center h-full flex-col gap-4 px-4">
        <div className="w-full max-w-3xl flex flex-col items-center gap-4">
          <h2 className="text-4xl">Access Denied</h2>
          <p className="text-xl pb-4">
            You do not have permission to view this page.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 overflow-auto h-full">
      <h2 className="text-2xl font-bold mb-4">Admin</h2>

      <BanManager />
      <TrustedUserManager />
      <CacheManager />
      <TwitchPermissions />
      <SpotifyPermissions />
    </div>
  );
};
