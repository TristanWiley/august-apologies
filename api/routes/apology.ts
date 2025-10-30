import type { IRequest } from "itty-router";
import { DB } from "../db";
import { generateJSONResponse } from "../utils";
import sanitizeHtml from "sanitize-html";

/**
 * Route to handle logging in a Twitch user
 */
export const submitApologyRoute = async (
  request: IRequest,
  env: Env
): Promise<Response> => {
  // Create a new database connection
  const connection = new DB(env);

  // Get the request body
  const requestData = await request.json();

  // Get the Twitch auth code from the request body
  const { sessionId, apology, subject } = requestData as {
    sessionId: string;
    apology: string;
    subject: string;
  };

  // If there is no sessionId, return a 400 response
  if (!sessionId) {
    return generateJSONResponse({ message: "No session ID provided" }, 400);
  }

  // If there is no apology or subject, return a 400 response
  if (!apology || !subject) {
    return generateJSONResponse(
      { message: "Apology and subject are required" },
      400
    );
  }

  const sanitizedApology = sanitizeHtml(apology);

  // Submit apology
  const success = await connection.submitApology({
    sessionId,
    apology: sanitizedApology,
    subject,
  });

  if (!success) {
    return generateJSONResponse({ message: "Failed to submit apology" }, 500);
  }

  return generateJSONResponse(
    {
      success: true,
    },
    200
  );
};
