import { Nav } from "../nav";

export const AccountPage: React.FC = () => {
  const isSubscriber = true; // Placeholder for actual subscriber status
  const subscriberTier = 1; // Placeholder for actual subscriber tier

  const addedSongs = [
    { title: "Song Title 1", artist: "Artist 1" },
    { title: "Song Title 2", artist: "Artist 2" },
    { title: "Song Title 3", artist: "Artist 3" },
  ];

  return (
    <div className="h-full flex flex-col items-center gap-6 px-4">
      <Nav />

      <main className="w-full max-w-4xl mt-4">
        <h1 className="text-2xl font-bold mb-5">Account Management</h1>

        {/* Subscriber status */}
        <section className="bg-slate-900/80 backdrop-blur-md p-6 rounded-lg shadow-md border border-slate-700/30 mb-6">
          <h2 className="text-xl font-semibold mb-4">Subscriber Status</h2>
          {isSubscriber ? (
            <p className="text-green-400">
              You are currently Tier {subscriberTier} sub. Thank you!
            </p>
          ) : (
            <div>
              <p className="mb-4">You are not currently a subscriber.</p>
              <a
                href="https://twitch.tv/august/subscribe"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-[#8956FB] text-white px-4 py-2 rounded-md hover:bg-[#7741d5] transition-shadow shadow-sm"
              >
                Subscribe on Twitch
              </a>
            </div>
          )}
        </section>

        {addedSongs.length > 0 && (
          <section className="bg-slate-900/80 backdrop-blur-md p-6 rounded-lg shadow-md border border-slate-700/30">
            <h2 className="text-xl font-semibold mb-4">Blalist Added Songs</h2>
            <p className="mb-2">
              You have added the following songs to the Blalist:
            </p>
            <ul className="list-disc list-inside space-y-1">
              {addedSongs.length === 0 ? (
                <li>No songs added yet.</li>
              ) : (
                addedSongs.map((song, index) => (
                  <li key={index}>
                    "{song.title}" by {song.artist}
                  </li>
                ))
              )}
            </ul>
          </section>
        )}
      </main>
    </div>
  );
};
