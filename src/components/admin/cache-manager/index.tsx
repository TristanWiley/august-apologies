import { useState } from "react";

export function CacheManager() {
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const handleClearCache = async (
    cacheType: "playlist" | "ownership" | "all"
  ) => {
    setIsLoading(true);
    setMessage(null);

    try {
      const sessionId = localStorage.getItem("august-session-id");
      if (!sessionId) {
        setMessage({ type: "error", text: "No session found. Please log in." });
        setIsLoading(false);
        return;
      }

      const response = await fetch("/api/admin/clear-cache", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sessionId,
          cacheType,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage({
          type: "error",
          text: data.message || "Failed to clear cache",
        });
        return;
      }

      setMessage({
        type: "success",
        text: data.message,
      });
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
      <h2 className="text-lg font-semibold mb-4 text-white">Clear Cache</h2>
      <div className="flex gap-2 flex-wrap mb-4">
        <button
          onClick={() => handleClearCache("playlist")}
          disabled={isLoading}
          className="px-4 py-2 bg-orange-600 text-white text-sm font-medium rounded hover:bg-orange-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? "Loading..." : "Clear Playlist"}
        </button>
        <button
          onClick={() => handleClearCache("ownership")}
          disabled={isLoading}
          className="px-4 py-2 bg-orange-600 text-white text-sm font-medium rounded hover:bg-orange-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? "Loading..." : "Clear Ownership"}
        </button>
        <button
          onClick={() => handleClearCache("all")}
          disabled={isLoading}
          className="px-4 py-2 bg-orange-700 text-white text-sm font-medium rounded hover:bg-orange-800 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? "Loading..." : "Clear All"}
        </button>
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
