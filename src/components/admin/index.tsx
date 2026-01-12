import { TwitchPermissions } from "./twitch-permissions";
import { BanManager } from "./ban-manager";
import { CacheManager } from "./cache-manager";

export const AdminPage = () => {
  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Admin</h2>

      <BanManager />
      <CacheManager />
      <TwitchPermissions />
    </div>
  );
};
