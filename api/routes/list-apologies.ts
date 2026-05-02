import type { IRequest } from "itty-router";
import { DB } from "../db";
import { generateJSONResponse } from "../utils/utils";
import z from "zod";
import { OpenAPIRoute, contentJson } from "chanfana";

const ListApologiesEndpointRequestSchema = z.object({
  query: z.object({
    page: z.string().optional(),
    pageSize: z.string().optional(),
  }),
});

const ListApologiesEndpointResponseSchema = z.object({
  items: z.array(z.any()),
  total: z.number(),
  page: z.number(),
  pageSize: z.number(),
});

export class ListApologiesEndpoint extends OpenAPIRoute {
  schema = {
    summary: "List public apologies",
    description: "Retrieve a list of public apologies with pagination.",
    tags: ["Apologies"],
    request: {
      query: ListApologiesEndpointRequestSchema.shape.query,
    },
    responses: {
      200: {
        description: "Success",
        ...contentJson(ListApologiesEndpointResponseSchema),
      },
    },
  };

  static handle = async (request: IRequest, env: Env): Promise<Response> => {
    try {
      const url = new URL(request.url);
      const page = Number(url.searchParams.get("page") || "1");
      const pageSize = Number(url.searchParams.get("pageSize") || "10");

      const offset = Math.max(0, (Math.max(1, page) - 1) * pageSize);

      const connection = new DB(env);
      const { items, total } = await connection.listPublicApologies({
        limit: pageSize,
        offset,
      });

      return generateJSONResponse({ items, total, page, pageSize }, 200);
    } catch (err) {
      console.error("listApologiesRoute error:", err);
      return generateJSONResponse({ message: "Internal server error" }, 500);
    }
  };
}
