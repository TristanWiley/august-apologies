import type { IRequest } from "itty-router";
import { DB } from "../db";
import { generateJSONResponse } from "../utils";

export const listApologiesRoute = async (request: IRequest, env: Env) => {
  try {
    const url = new URL(request.url);
    const page = Number(url.searchParams.get("page") || "1");
    const pageSize = Number(url.searchParams.get("pageSize") || "10");

    const offset = Math.max(0, (Math.max(1, page) - 1) * pageSize);

    const connection = new DB(env);
    const { items, total } = await connection.listPublicApologies({ limit: pageSize, offset });

    return generateJSONResponse({ items, total, page, pageSize }, 200);
  } catch (err) {
    console.error("listApologiesRoute error:", err);
    return generateJSONResponse({ message: "Internal server error" }, 500);
  }
};