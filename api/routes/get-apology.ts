import type { IRequest } from "itty-router";
import { DB } from "../db";
import { generateJSONResponse } from "../utils";

export const getApologyRoute = async (
  request: IRequest,
  env: Env
): Promise<Response> => {
  // Create a new database connection
  const connection = new DB(env);

  // Get the request body
  const requestData = request.params;

  console.log(requestData);

  // Get the Twitch auth code from the request body
  const { id } = requestData as {
    id: string;
  };

  // If there is no id, return a 400 response
  if (!id) {
    return generateJSONResponse({ message: "No id provided" }, 400);
  }
  // Submit apology
  const apology = await connection.getApologyByID(id);

  if (!apology) {
    return generateJSONResponse({ message: "Failed to get apology" }, 500);
  }

  return generateJSONResponse(
    {
      success: true,
      username: apology.username,
      subject: apology.subject,
      apology: apology.apology,
    },
    200
  );
};
