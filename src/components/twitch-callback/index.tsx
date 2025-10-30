import { useEffect } from "react";
import { useNavigate } from "react-router";

export const TwitchCallbackPage: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get("code");

    if (!code) {
      return;
    }

    // Store the code in local storage
    // This is used to get the access token
    localStorage.setItem(`august-twitch-code`, code);

    // Close the tab
    window.close();
  }, [navigate]);

  return <div></div>;
};
