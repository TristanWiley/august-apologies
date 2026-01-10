import type { IRequest } from "itty-router";
import { generateJSONResponse } from "../../utils/utils";

export const adminTwitchAuthRoute = async (request: IRequest, env: Env) => {
  return generateJSONResponse({ message: "Admin OAuth disabled" }, 404);
};
