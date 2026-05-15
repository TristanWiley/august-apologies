- The app now has a centralized route configuration in `src/App.tsx`. Add routes by adding entries to the `routes` array — each entry is `{ path, element, auth }`, where `auth: true` protects the route and redirects to `/login` if unauthenticated.

- The homepage (`/`) is implemented in `src/components/homepage` and includes an iframe that embeds August's stream (`channel = "august"`).

- The Twitch Extension build lives under `extensions/twitch`. Run `pnpm run build:twitch` to emit the compiled `config.html` and `panel.html` files into `extensions/twitch/dist`.
- For local development, run `pnpm run dev:twitch` and open `http://localhost:5173/config.html` or `http://localhost:5173/panel.html`.
