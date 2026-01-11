export interface KVTwitchAuthPermissions {
  access_token: string;
  refresh_token: string;
  scope: string[];
  token_type: string;
  expires_in: number;
  obtained_at: number;
}
export interface KVSpotifyCredentials {
  client_id: string;
  client_secret: string;
  refresh_token: string;
  access_token?: string;
  access_token_obtained_at?: number;
  access_token_expires_in?: number;
}
