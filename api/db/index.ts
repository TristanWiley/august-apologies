import { drizzle, DrizzleD1Database } from "drizzle-orm/d1";
import * as schema from "./drizzle/schema";
import { eq } from "drizzle-orm";

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
  }): Promise<{
    sessionId: string;
    subject: string | null;
    apology: string | null;
  } | null> {
    // Create session id
    const sessionId = crypto.randomUUID();

    const response = await this.db
      .insert(schema.apologies)
      .values({
        twitch_id: id,
        twitch_username: displayName,
        session_id: sessionId,
      })
      .onConflictDoUpdate({
        target: schema.apologies.twitch_id,
        set: {
          twitch_username: displayName,
          session_id: sessionId,
        },
      })
      .returning();

    if (!response) {
      return null;
    }

    const record = response[0];

    return {
      sessionId: sessionId,
      subject: record.subject,
      apology: record.apology_text,
    };
  }

  public async submitApology({
    sessionId,
    apology,
    subject,
  }: {
    sessionId: string;
    apology: string;
    subject: string;
  }): Promise<boolean> {
    const response = await this.db
      .update(schema.apologies)
      .set({ apology_text: apology, subject })
      .where(eq(schema.apologies.session_id, sessionId));

    return response.meta.changes > 0;
  }

  public async getApologyByID(apologyID: string): Promise<{
    username: string;
    subject: string;
    apology: string;
  } | null> {
    const record = await this.db
      .select()
      .from(schema.apologies)
      .where(eq(schema.apologies.twitch_id, apologyID))
      .limit(1)
      .then((res) => res[0]);

    if (!record || !record.apology_text || !record.subject) {
      return null;
    }

    return {
      username: record.twitch_username,
      subject: record.subject,
      apology: record.apology_text,
    };
  }
}
