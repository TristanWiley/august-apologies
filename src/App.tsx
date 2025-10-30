import { DvdScreensaver } from "react-dvd-screensaver";
import { BrowserRouter, Navigate, Route, Routes } from "react-router";
import { ApologySubmission } from "./components/apology-submission";
import { LoginPage } from "./components/login-page";
import React from "react";
import { TwitchCallbackPage } from "./components/twitch-callback";
import { ApologyView } from "./components/apology-view";

export const App = () => {
  const sessionId = localStorage.getItem("august-session-id");

  const content = (
    <BrowserRouter>
      <Routes>
        {sessionId ? (
          <React.Fragment>
            <Route path="/apology" element={<ApologySubmission />} />
            {/* default redirect to main page */}
            <Route path="*" element={<Navigate to="/apology" />} />
          </React.Fragment>
        ) : (
          <React.Fragment>
            <Route path="/login" element={<LoginPage />} />

            {/* default redirect to login page */}
            <Route path="*" element={<Navigate to="/login" />} />
          </React.Fragment>
        )}
        <Route path="/twitch-callback" element={<TwitchCallbackPage />} />
        <Route path="/view/:id" element={<ApologyView />} />
      </Routes>
    </BrowserRouter>
  );

  return (
    <div className="w-full h-full">
      <div className="w-full h-full">{content}</div>

      {sessionId && (
        <button
          onClick={() => {
            localStorage.removeItem("august-session-id");
            localStorage.removeItem("august-temp-apology");
            localStorage.removeItem("august-temp-subject");
            window.location.reload();
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
