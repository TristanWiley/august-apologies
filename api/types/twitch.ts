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

/**
 * PowerUpRedemptionWebhookPayload
 */

export interface PowerUpRedemptionWebhookPayload {
  subscription: Subscription;
  event: Event;
}

export interface Event {
  id: string;
  broadcaster_user_id: string;
  broadcaster_user_login: string;
  broadcaster_user_name: string;
  user_id: string;
  user_login: string;
  user_name: string;
  user_input: string;
  status: string;
  custom_power_up: CustomPowerUp;
  redeemed_at: Date;
}

export interface CustomPowerUp {
  id: string;
  title: string;
  bits: number;
  prompt: string;
}

export interface Subscription {
  id: string;
  type: string;
  version: string;
  status: string;
  cost: number;
  condition: Condition;
  transport: Transport;
  created_at: Date;
}

export interface Condition {
  broadcaster_user_id: string;
  reward_id: string;
}

export interface Transport {
  method: string;
  callback: string;
}
