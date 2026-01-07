import { useEffect } from "react";

export const AdminTwitchCallbackPage: React.FC = () => {
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get("code");

    if (!code) {
      return;
    }

    // Store the admin twitch code in local storage for the admin UI to pick up
    localStorage.setItem(`august-admin-twitch-code`, code);

    // Close the tab
    window.close();
  }, []);

  return <div></div>;
};
