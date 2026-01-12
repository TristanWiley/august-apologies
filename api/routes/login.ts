import type { IRequest } from "itty-router";
import { DB, type AccountSelectType } from "../db";
import { generateJSONResponse } from "../utils/utils";
import type {
  TwitchHelixUsersResponse,
  TwitchOAuthTokenResponse,
} from "../types/twitch";
import { TwitchApi } from "ts-twitch-api";

/**
 * Route to handle logging in a Twitch user
 */
export const loginRoute = async (
  request: IRequest,
  env: Env
): Promise<Response> => {
  // Create a new database connection
  const connection = new DB(env);

  // Get the request body
  const requestData = await request.json();

  // Get the Twitch auth code from the request body
  const { code, redirectURL } = requestData as {
    code: string;
    redirectURL: string;
  };

  // If there is no code, return a 400 response
  if (!code) {
    return generateJSONResponse(
      { message: "No Twitch auth code provided" },
      400
    );
  }

  // If there is no redirectURL, return a 400 response
  if (!redirectURL) {
    return generateJSONResponse({ message: "No redirect URL provided" }, 400);
  }

  // Get the Twitch auth token from the Twitch API
  const tokenResponse = await fetch("https://id.twitch.tv/oauth2/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      client_id: env.TWITCH_CLIENT_ID,
      client_secret: env.TWITCH_CLIENT_SECRET,
      code,
      grant_type: "authorization_code",
      redirect_uri: redirectURL,
    }),
  });

  // If the response is not ok, return a 500 response
  if (!tokenResponse.ok) {
    return generateJSONResponse(
      {
        message:
          "Failed to get Twitch auth token, please try again. If the problem persists, please message a mod for help.",
      },
      500
    );
  }

  // Get the token response as a JSON object
  const tokenResponseJSON =
    (await tokenResponse.json()) as TwitchOAuthTokenResponse;

  // Get the Twitch auth token and refresh token from the response
  const { access_token, refresh_token } = tokenResponseJSON;

  // Get the Twitch user data from the Twitch API
  const userDataResponse = await fetch("https://api.twitch.tv/helix/users", {
    headers: {
      Authorization: `Bearer ${access_token}`,
      "Client-Id": env.TWITCH_CLIENT_ID,
    },
  });

  // If the response is not ok, return a 500 response
  if (!userDataResponse.ok) {
    return generateJSONResponse(
      {
        message:
          "Failed to get Twitch user data, please try again. If the problem persists, please message a mod for help.",
      },
      500
    );
  }

  // Get the user data response as a JSON object
  const userDataResponseJSON =
    (await userDataResponse.json()) as TwitchHelixUsersResponse;

  // If no user is returned, return an error
  if (!userDataResponseJSON.data.length) {
    return generateJSONResponse(
      {
        message:
          "Failed to get Twitch user data, please try again. If the problem persists, please message a mod for help.",
      },
      500
    );
  }

  const userData = userDataResponseJSON.data[0];

  // Get the Twitch id and username from the response
  const { id, display_name } = userData;

  // If there is no id, return a 500 response
  if (!id) {
    return generateJSONResponse(
      {
        message:
          "Failed to get Twitch id, please try again. If the problem persists, please message a mod for help.",
      },
      500
    );
  }

  // Check if user is banned
  const isBanned = await connection.isBanned(id);
  if (isBanned) {
    return generateJSONResponse(
      {
        message: "Your account has been banned and cannot access this service.",
      },
      403
    );
  }

  // Update account with new Twitch id and auth token
  const data = await connection.createUser({
    id,
    displayName: display_name,
    accessToken: access_token,
    refreshToken: refresh_token,
  });

  // If the result is not ok, return a 500 response
  if (!data) {
    return generateJSONResponse(
      {
        message:
          "Failed to connect Twitch account, please try again. If the problem persists, please message a mod for help.",
      },
      500
    );
  }

  // Check if the user is subscribed to the broadcaster
  let isSubscriber = false;
  let subscriptionType: string | undefined = undefined;
  let isGiftedSub = false;

  try {
    const twitchApi = new TwitchApi({
      accessToken: access_token,
      clientId: env.TWITCH_CLIENT_ID,
    });

    console.log(
      "Checking subscription status for user ID:",
      id,
      env.TWITCH_BROADCASTER_ID
    );

    const response = await twitchApi.subscriptions.checkUserSubscription({
      broadcaster_id: env.TWITCH_BROADCASTER_ID,
      user_id: id,
    });

    console.log("Subscription check response:", response);

    if (response.ok && response.data.data.length > 0) {
      isSubscriber = true;
      subscriptionType = response.data.data[0].tier;
      isGiftedSub = response.data.data[0].is_gift;
    }
  } catch (err) {
    console.warn("Error checking subscription status", err);
  }

  let account: AccountSelectType | null = null;

  // Persist subscriber flag if obtained
  if (isSubscriber) {
    try {
      account = await connection.setSubscriber(
        id,
        isSubscriber,
        subscriptionType,
        isGiftedSub
      );
    } catch (err) {
      console.warn("Failed to set subscriber flag", err);
    }
  }

  // Fetch account info if not already fetched
  if (!account) {
    account = await connection.getAccountByTwitchID(id);
  }

  // Return a 200 response
  return generateJSONResponse(
    {
      success: true,
      message: "Successfully logged in",
      data: {
        twitchID: id,
        twitchUsername: account?.display_name || display_name,
        sessionId: account?.session_id || data.session_id,
        isSubscriber: account?.is_subscriber ?? false,
      },
    },
    200
  );
};
