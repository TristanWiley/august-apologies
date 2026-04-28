import { useDvdScreensaver } from "react-dvd-screensaver";
import { BrowserRouter, Navigate, Route, Routes } from "react-router";
import React from "react";
import { ApologySubmission } from "./components/apology-submission";
import { HomePage } from "./components/homepage";
import { PlaylistPage } from "./components/playlist";
import { ApologiesPage } from "./components/apologies";
import { TwitchCallbackPage } from "./components/twitch-callback";
import { AdminPage } from "./components/admin";
import { AdminTwitchCallbackPage } from "./components/admin/twitch-callback";
import { ApologyView } from "./components/apology-view";
import { LoginPage } from "./components/login-page";
import { AccountPage } from "./components/account-page";
import { Nav } from "./components/nav";
import { SpotifyCallbackPage } from "./components/spotify-callback";

const AppFrame: React.FC<{
  children: React.ReactNode;
  showNav?: boolean;
}> = ({ children, showNav = true }) => {
  return (
    <>
      {showNav ? <Nav /> : null}
      <div className={showNav ? "w-full h-full pt-20" : "w-full h-full"}>
        {children}
      </div>
    </>
  );
};

export const App = () => {
  const sessionId = localStorage.getItem("august-session-id");
  const { containerRef, elementRef, impactCount } = useDvdScreensaver({
    speed: 3,
  });

  // Centralized route config — add new routes here as needed
  const routes = [
    { path: "/", element: <HomePage />, auth: false, showNav: true },
    { path: "/account", element: <AccountPage />, auth: true, showNav: true },
    {
      path: "/apology",
      element: <ApologySubmission />,
      auth: true,
      showNav: true,
    },
    {
      path: "/apologies",
      element: <ApologiesPage />,
      auth: false,
      showNav: true,
    },
    {
      path: "/playlist",
      element: <PlaylistPage />,
      auth: false,
      showNav: true,
    },
    { path: "/login", element: <LoginPage />, auth: false, showNav: true },
    {
      path: "/twitch-callback",
      element: <TwitchCallbackPage />,
      auth: false,
      showNav: false,
    },
    {
      path: "/spotify-callback",
      element: <SpotifyCallbackPage />,
      auth: false,
      showNav: false,
    },
    { path: "/admin", element: <AdminPage />, auth: false, showNav: false },
    {
      path: "/admin/twitch-callback",
      element: <AdminTwitchCallbackPage />,
      auth: false,
      showNav: false,
    },
    { path: "/view/:id", element: <ApologyView />, auth: false, showNav: true },
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
            <Route
              key={r.path}
              path={r.path}
              element={<AppFrame showNav={r.showNav}>{r.element}</AppFrame>}
            />
          ),
        )}

        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );

  const accent = ["#8d86c9", "#f9a03f", "#59d7ff", "#ff6b8a"];
  const logoTint = accent[impactCount % accent.length];

  return (
    <div className="relative w-full h-full">
      <div className="relative z-10 w-full h-full">{content}</div>

      <div
        ref={containerRef}
        className="absolute inset-0 z-0 overflow-hidden pointer-events-none"
      >
        <div ref={elementRef} className="absolute top-0 left-0">
          <div
            className="w-fit opacity-30 transition-[filter,transform] duration-300"
            style={{ filter: `drop-shadow(0 0 24px ${logoTint}66)` }}
          >
            <img
              src="/augRiot.webp"
              alt=""
              className="w-16 h-16 animate-spin"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
