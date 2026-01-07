import { drizzle, DrizzleD1Database } from "drizzle-orm/d1";
import * as schema from "./drizzle/schema";
import { eq } from "drizzle-orm";

export class DB {
  private db: DrizzleD1Database<typeof schema>;

  constructor(env: Env) {
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
      .insert(schema.accounts)
      .values({
        twitch_id: id,
        display_name: displayName,
        session_id: sessionId,
      })
      .onConflictDoUpdate({
        target: schema.accounts.twitch_id,
        set: { display_name: displayName, session_id: sessionId },
      })
      .returning();

    if (!response) {
      return null;
    }

    return {
      sessionId: sessionId,
      subject: null,
      apology: null,
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

  // Accounts helpers
  public async getAccountBySession(sessionId: string): Promise<{
    twitch_id: string;
    display_name: string;
    is_subscriber: boolean;
  } | null> {
    const record = await this.db
      .select({
        twitch_id: schema.accounts.twitch_id,
        display_name: schema.accounts.display_name,
        is_subscriber: schema.accounts.is_subscriber,
      })
      .from(schema.accounts)
      .where(eq(schema.accounts.session_id, sessionId))
      .limit(1)
      .then((r) => r[0]);

    if (!record) return null;

    return {
      twitch_id: record.twitch_id as string,
      display_name: record.display_name as string,
      is_subscriber: Boolean(record.is_subscriber),
    };
  }

  public async setSubscriber(
    twitchId: string,
    flag: boolean
  ): Promise<boolean> {
    const response = await this.db
      .update(schema.accounts)
      .set({ is_subscriber: flag ? 1 : 0 })
      .where(eq(schema.accounts.twitch_id, twitchId));

    return response.meta.changes > 0;
  }

  public async getAccountByTwitchID(twitchId: string) {
    const record = await this.db
      .select()
      .from(schema.accounts)
      .where(eq(schema.accounts.twitch_id, twitchId))
      .limit(1)
      .then((r) => r[0]);

    if (!record) return null;
    return {
      twitch_id: record.twitch_id as string,
      display_name: record.display_name as string,
      is_subscriber: Boolean(record.is_subscriber),
    };
  }

  public async listPublicApologies({
    limit = 10,
    offset = 0,
  }: { limit?: number; offset?: number } = {}): Promise<{
    items: { id: string; username: string; subject: string; excerpt: string }[];
    total: number;
  }> {
    // Get total
    const all = await this.db
      .select()
      .from(schema.apologies)
      .then((r) => r.filter((row) => row.apology_text && row.subject));

    const total = all.length;

    const rows = await this.db
      .select({
        id: schema.apologies.twitch_id,
        username: schema.apologies.twitch_username,
        subject: schema.apologies.subject,
        apology: schema.apologies.apology_text,
      })
      .from(schema.apologies)
      .limit(limit)
      .offset(offset)
      .then((r) => r.filter((row) => row.apology && row.subject));
    const stripHtml = (s: string | null | undefined) => {
      if (!s) return "";
      return s.replace(/<[^>]+>/g, "").slice(0, 240);
    };

    const items = rows.map(
      (r: {
        id: string;
        username: string;
        subject: string | null;
        apology: string | null;
      }) => ({
        id: r.id as string,
        username: r.username as string,
        subject: r.subject as string,
        excerpt: stripHtml(r.apology as string),
      })
    );

    return { items, total };
  }
}
