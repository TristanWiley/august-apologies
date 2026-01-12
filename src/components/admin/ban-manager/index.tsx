import { useState } from "react";

export function BanManager() {
  const [twitchId, setTwitchId] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const handleBanUser = async (action: "ban" | "unban") => {
    if (!twitchId.trim()) {
      setMessage({ type: "error", text: "Please enter a Twitch ID" });
      return;
    }

    setIsLoading(true);
    setMessage(null);

    try {
      const sessionId = localStorage.getItem("august-session-id");
      if (!sessionId) {
        setMessage({ type: "error", text: "No session found. Please log in." });
        setIsLoading(false);
        return;
      }

      const response = await fetch("/api/admin/ban-user", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          twitchId: twitchId.trim(),
          action,
          sessionId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage({
          type: "error",
          text: data.message || `Failed to ${action} user`,
        });
        return;
      }

      setMessage({
        type: "success",
        text: `User @${data.data.displayName} has been ${
          action === "ban" ? "banned" : "unbanned"
        }`,
      });
      setTwitchId("");
    } catch (error) {
      setMessage({
        type: "error",
        text: `Error: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-slate-950 border border-slate-700 rounded-lg p-5 m-5">
      <h2 className="text-lg font-semibold mb-4 text-white">Ban User</h2>
      <div className="flex gap-3 flex-wrap mb-4">
        <input
          type="text"
          placeholder="Enter Twitch ID or username"
          value={twitchId}
          onChange={(e) => setTwitchId(e.target.value)}
          disabled={isLoading}
          className="flex-1 min-w-[200px] px-3 py-2 bg-slate-800 border border-slate-600 rounded text-white text-sm placeholder-slate-500 disabled:opacity-60 disabled:cursor-not-allowed"
        />
        <div className="flex gap-2">
          <button
            onClick={() => handleBanUser("ban")}
            disabled={isLoading}
            className="px-4 py-2 bg-red-700 text-white text-sm font-medium rounded hover:bg-red-800 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? "Loading..." : "Ban User"}
          </button>
          <button
            onClick={() => handleBanUser("unban")}
            disabled={isLoading}
            className="px-4 py-2 bg-green-700 text-white text-sm font-medium rounded hover:bg-green-800 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? "Loading..." : "Unban User"}
          </button>
        </div>
      </div>

      {message && (
        <div
          className={`p-3 rounded text-sm mt-3 ${
            message.type === "success"
              ? "bg-green-700 text-white border border-green-800"
              : "bg-red-700 text-white border border-red-800"
          }`}
        >
          {message.text}
        </div>
      )}
    </div>
  );
}
