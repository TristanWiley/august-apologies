import { DvdScreensaver } from "react-dvd-screensaver";
import { BrowserRouter, Navigate, Route, Routes } from "react-router";
import { ApologySubmission } from "./components/apology-submission";
import { HomePage } from "./components/homepage";
import { PlaylistPage } from "./components/playlist";
import { ApologiesPage } from "./components/apologies";
import { TwitchCallbackPage } from "./components/twitch-callback";
import { ApologyView } from "./components/apology-view";
import { LoginPage } from "./components/login-page";

export const App = () => {
  const sessionId = localStorage.getItem("august-session-id");

  // Centralized route config — add new routes here as needed
  const routes = [
    { path: "/", element: <HomePage />, auth: false },
    { path: "/apology", element: <ApologySubmission />, auth: true },
    { path: "/apologies", element: <ApologiesPage />, auth: false },
    { path: "/playlist", element: <PlaylistPage />, auth: false },
    { path: "/login", element: <LoginPage />, auth: false },
    { path: "/twitch-callback", element: <TwitchCallbackPage />, auth: false },
    { path: "/view/:id", element: <ApologyView />, auth: false },
  ];

  const content = (
    <BrowserRouter>
      <Routes>
        {routes.map((r) =>
          r.auth && !sessionId ? (
            <Route
              key={r.path}
              path={r.path}
              element={<Navigate to={`/login?redirect=${r.path}`} />}
            />
          ) : (
            <Route key={r.path} path={r.path} element={r.element} />
          )
        )}

        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );

  return (
    <div className="w-full h-full">
      <div className="w-full h-full pt-20">{content}</div>

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
