import type { IRequest } from "itty-router";
import { generateJSONResponse } from "../utils/utils";
import z from "zod";
import { contentJson, OpenAPIRoute } from "chanfana";
import { ErrorResponseSchema } from "../types/endpoints";

const EventSubCallbackEndpointRequestSchema = z.object({
  headers: z.object({
    "Twitch-Eventsub-Message-Type": z.string().max(100),
    "Twitch-Eventsub-Message-Id": z.string().max(100),
    "Twitch-Eventsub-Message-Timestamp": z.string().max(100),
    "Twitch-Eventsub-Message-Signature": z.string().max(100),
  }),
  text: z.string().max(1000),
});

export class EventSubCallbackEndpoint extends OpenAPIRoute {
  schema = {
    summary: "Twitch EventSub callback endpoint",
    description:
      "Endpoint to receive Twitch EventSub notifications and handle verification challenges.",
    tags: ["Twitch", "EventSub"],
    request: {
      headers: EventSubCallbackEndpointRequestSchema.shape.headers,
      content: z.string(),
    },
    responses: {
      200: {
        description: "Success",
        content: {
          "text/plain": {
            schema: z.string(),
          },
        },
      },
      400: {
        description: "Bad request",
        ...contentJson(ErrorResponseSchema),
      },
      403: {
        description: "Forbidden",
        ...contentJson(ErrorResponseSchema),
      },
    },
  };

  static handle = async (request: IRequest, env: Env) => {
    const messageType = request.headers.get("Twitch-Eventsub-Message-Type");
    const messageId = request.headers.get("Twitch-Eventsub-Message-Id");
    const messageTimestamp = request.headers.get(
      "Twitch-Eventsub-Message-Timestamp",
    );
    const messageSignature = request.headers.get(
      "Twitch-Eventsub-Message-Signature",
    );

    const bodyText = await request.text();

    // For verification challenge messages, respond with the challenge text
    if (messageType === "webhook_callback_verification") {
      try {
        const parsed = JSON.parse(bodyText) as { challenge?: string };
        const challenge = parsed.challenge;
        if (challenge) {
          return new Response(challenge, {
            status: 200,
            headers: { "content-type": "text/plain" },
          });
        }
      } catch (err) {
        console.error("Failed to parse verification body", err);
      }
      return generateJSONResponse({ message: "Malformed verification" }, 400);
    }

    // Verify signature for notifications and revocations
    const kv = env.PERMISSIONS_KV;

    const secret = await kv.get("twitch:eventsub:secret");
    if (!secret) {
      console.error("EventSub secret missing");
      return generateJSONResponse({ message: "No secret configured" }, 500);
    }

    if (!messageSignature || !messageId || !messageTimestamp) {
      console.warn("Missing EventSub headers");
      return generateJSONResponse({ message: "Missing headers" }, 400);
    }

    // Compute HMAC_SHA256(secret, messageId + messageTimestamp + body)
    const encoder = new TextEncoder();
    const data = encoder.encode(messageId + messageTimestamp + bodyText);
    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"],
    );
    const sig = await crypto.subtle.sign("HMAC", key, data);
    const computed = Array.from(new Uint8Array(sig))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
    const expected = `sha256=${computed}`;

    if (messageSignature !== expected) {
      console.warn("Invalid EventSub signature");
      return generateJSONResponse({ message: "Invalid signature" }, 403);
    }

    // Handle notification / revocation
    if (messageType === "notification") {
      // Route notifications as needed. For now, log them.
      try {
        const parsed = JSON.parse(bodyText) as any;
        console.log("EventSub notification received", parsed);
        // TODO: handle specific event types (e.g., channel.subscribe)
      } catch (err) {
        console.warn("Failed to parse EventSub notification", err);
      }
    } else if (messageType === "revocation") {
      try {
        const parsed = JSON.parse(bodyText) as any;
        console.warn("EventSub subscription revoked", parsed);
      } catch (err) {
        console.warn("Failed to parse EventSub revocation", err);
      }
    }

    return new Response("OK", { status: 200 });
  };
}
