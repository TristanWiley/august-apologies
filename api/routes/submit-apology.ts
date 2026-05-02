import type { IRequest } from "itty-router";
import { DB } from "../db";
import { generateJSONResponse } from "../utils/utils";
import sanitizeHtml from "sanitize-html";
import { contentJson, OpenAPIRoute } from "chanfana";
import z from "zod";

const SubmitApologyEndpointRequestSchema = z.object({
  sessionId: z.uuid(),
  apology: z.string().min(1),
  subject: z.string().min(1),
});

const SubmitApologyEndpointResponseSchema = z.object({
  success: z.boolean(),
});

export class SubmitApologyEndpoint extends OpenAPIRoute {
  schema = {
    summary: "Submit an apology",
    description: "Submit an apology with a subject. Requires authentication.",
    tags: ["Apologies"],
    request: {
      body: contentJson(SubmitApologyEndpointRequestSchema),
    },
    response: {
      200: {
        description: "Apology submitted successfully",
        ...contentJson(SubmitApologyEndpointResponseSchema),
      },
    },
  };

  async handle(request: IRequest, env: Env): Promise<Response> {
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
        400,
      );
    }

    // Get logged in user
    const account = await connection.getAccountBySession(sessionId);

    if (!account) {
      return generateJSONResponse({ message: "Invalid session ID" }, 400);
    }

    const sanitizedApology = sanitizeHtml(apology);

    // Submit apology
    const success = await connection.submitApology({
      account,
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
      200,
    );
  }
}
