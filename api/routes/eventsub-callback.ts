import type { IRequest } from "itty-router";
import { generateJSONResponse } from "../utils";

export const eventsubCallbackRoute = async (request: IRequest, env: Env) => {
  return generateJSONResponse({ message: "EventSub disabled" }, 404);
};
