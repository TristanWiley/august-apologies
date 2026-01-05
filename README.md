- The app now has a centralized route configuration in `src/App.tsx`. Add routes by adding entries to the `routes` array — each entry is `{ path, element, auth }`, where `auth: true` protects the route and redirects to `/login` if unauthenticated.

- The homepage (`/`) is implemented in `src/components/homepage` and includes an iframe that embeds August's stream (`channel = "august"`).
