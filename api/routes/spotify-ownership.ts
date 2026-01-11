import type { IRequest } from "itty-router";
import { generateJSONResponse } from "../utils/utils";
import {
  getStoredSpotifyOwnership,
  storeSpotifyOwnership,
} from "../utils/cache";
import { DB } from "../db";

// Gets the Spotify tracks and ownership info for the playlist from the DB
export const spotifyOwnershipRoute = async (_request: IRequest, env: Env) => {
  try {
    // First check the cache
    const cachedOwnership = await getStoredSpotifyOwnership();
    if (cachedOwnership) {
      console.log("Using cached Spotify ownership data");
      return generateJSONResponse(
        { ownership: cachedOwnership, cached: true },
        200
      );
    }

    // If not cached, fetch from the database
    const connection = new DB(env);
    const ownershipData = await connection.getAllPlaylistOwnerships();

    // Update cache
    await storeSpotifyOwnership(ownershipData);

    return generateJSONResponse(
      { ownership: ownershipData, cached: false },
      200
    );
  } catch (error) {
    console.error("Error in spotifyOwnershipRoute:", error);
    return generateJSONResponse(
      { error: "Failed to retrieve Spotify ownership data" },
      500
    );
  }
};
