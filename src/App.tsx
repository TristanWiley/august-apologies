import { useState } from "react";
import { LoginPage } from "./components/login-page";
import { ApologySubmission } from "./components/apology-submission";
import { DvdScreensaver } from "react-dvd-screensaver";

export const App = () => {
  const [sessionId, setSessionId] = useState<string | null>(
    localStorage.getItem("august-session-id") || null
  );

  let content = null;

  if (!sessionId) {
    content = <LoginPage onLoginSuccess={(token) => setSessionId(token)} />;
  } else {
    content = <ApologySubmission sessionId={sessionId} />;
  }

  return (
    <div className="w-full h-full">
      <div className="w-full h-full">{content}</div>

      {sessionId && (
        <button
          onClick={() => {
            localStorage.removeItem("august-session-id");
            setSessionId(null);
          }}
          className="absolute bottom-4 right-4 bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600 transition cursor-pointer z-10"
        >
          Log out
        </button>
      )}

      <div className="absolute top-0 left-0 w-full h-full pointer-events-none -z-50">
        <DvdScreensaver>
          <div className="w-fit opacity-30">
            <img
              src="/augRiot.webp"
              alt=""
              className="w-16 h-16 animate-spin"
            />
          </div>
        </DvdScreensaver>
      </div>
    </div>
  );
};
