import type { IRequest } from "itty-router";
import { DB } from "../db";
import { generateJSONResponse } from "../utils";

export const getAccountSessionRoute = async (request: IRequest, env: Env) => {
  try {
    const url = new URL(request.url);
    const sessionId = url.searchParams.get("sessionId");
    if (!sessionId)
      return generateJSONResponse({ message: "No sessionId provided" }, 400);

    const connection = new DB(env);
    const account = await connection.getAccountBySession(sessionId);
    if (!account) return generateJSONResponse({ message: "Not found" }, 404);

    return generateJSONResponse({ success: true, account }, 200);
  } catch (err) {
    console.error("getAccountSessionRoute error:", err);
    return generateJSONResponse({ message: "Internal server error" }, 500);
  }
};
