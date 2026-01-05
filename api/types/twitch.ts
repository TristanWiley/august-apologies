export interface TwitchOAuthTokenResponse {
  access_token: string;
  expires_in: number;
  refresh_token: string;
  scope: [string];
  token_type: string;
}

export interface TwitchHelixUsersData {
  id: string;
  login: string;
  display_name: string;
  type: string;
  broadcaster_type: string;
  description: string;
  profile_image_url: string;
  offline_image_url: string;
  view_count: number;
  email: string;
  created_at: string;
}

export interface TwitchHelixUsersResponse {
  data: TwitchHelixUsersData[];
}

export interface TwitchHelixStreamsData {
  id: string;
  user_id: string;
  user_login: string;
  user_name: string;
  game_id: string;
  community_ids: string[];
  type: string;
  title: string;
  viewer_count: number;
  started_at: string;
  language: string;
}

export interface TwitchHelixStreamsResponse {
  data: TwitchHelixStreamsData[];
}
