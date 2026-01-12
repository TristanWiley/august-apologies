import { useState } from "react";

export function TrustedUserManager() {
  const [twitchId, setTwitchId] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const handleSetTrusted = async (isTrusted: boolean) => {
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

      const response = await fetch("/api/admin/set-trusted-user", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          targetTwitchId: twitchId.trim(),
          isTrusted,
          sessionId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage({
          type: "error",
          text: data.message || "Failed to update trusted status",
        });
        return;
      }

      setMessage({
        type: "success",
        text: `User @${data.account.display_name} is now ${
          isTrusted ? "trusted" : "not trusted"
        }. They can ${
          isTrusted
            ? "add songs directly without approval"
            : "no longer add songs directly"
        }.`,
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
      <h2 className="text-lg font-semibold mb-2 text-white">Trusted Users</h2>
      <p className="text-sm text-slate-400 mb-4">
        Trusted users can add songs directly to the playlist without waiting for
        approval. Owners are automatically trusted.
      </p>
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
            onClick={() => handleSetTrusted(true)}
            disabled={isLoading}
            className="px-4 py-2 bg-blue-700 text-white text-sm font-medium rounded hover:bg-blue-800 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? "Loading..." : "Set Trusted"}
          </button>
          <button
            onClick={() => handleSetTrusted(false)}
            disabled={isLoading}
            className="px-4 py-2 bg-slate-700 text-white text-sm font-medium rounded hover:bg-slate-600 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? "Loading..." : "Remove Trust"}
          </button>
        </div>
      </div>

      {message && (
        <div
          className={`p-3 rounded text-sm ${
            message.type === "success"
              ? "bg-green-900 text-green-200 border border-green-700"
              : "bg-red-900 text-red-200 border border-red-700"
          }`}
        >
          {message.text}
        </div>
      )}
    </div>
  );
}
