/// <reference types="@types/twitch-player" />

declare global {
  interface Window {
    Twitch: typeof Twitch;
  }
}

export {};
