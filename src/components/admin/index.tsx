import { TwitchPermissions } from "./twitch-permissions";

export const AdminPage = () => {
  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Admin</h2>

      <TwitchPermissions />
    </div>
  );
};
