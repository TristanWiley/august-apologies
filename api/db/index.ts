import { drizzle, DrizzleD1Database } from "drizzle-orm/d1";
import * as schema from "./drizzle/schema";

export class DB {
  private env: Env;
  private db: DrizzleD1Database<typeof schema>;

  constructor(env: Env) {
    this.env = env;

    const db = drizzle(env.DB, {
      schema,
      logger: false,
    });

    this.db = db;
  }

  public async createUser({
    id,
    displayName,
  }: {
    id: string;
    displayName: string;
  }): Promise<string | null> {
    // Create session id
    const sessionId = crypto.randomUUID();

    const response = await this.db.insert(schema.apologies).values({
      twitch_id: id,
      twitch_username: displayName,
      session_id: sessionId,
    });

    if (!response.success) {
      return null;
    }

    return sessionId;
  }
}
