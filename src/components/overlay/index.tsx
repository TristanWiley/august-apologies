import { useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  getOverlaySpotifyNowPlayingEndpoint,
  type GetOverlaySpotifyNowPlayingEndpointResponse,
} from "../../api/client";
import MusicNoteIcon from "@mui/icons-material/MusicNote";

const SAMPLE_SPOTIFY_DATA_TEMPLATE: GetOverlaySpotifyNowPlayingEndpointResponse =
  {
    track: {
      artists: [
        {
          external_urls: {
            spotify: "https://open.spotify.com/artist/667EyTZx1NKnqwRwhwYQYv",
          },
          href: "https://api.spotify.com/v1/artists/667EyTZx1NKnqwRwhwYQYv",
          id: "667EyTZx1NKnqwRwhwYQYv",
          name: "Cynthia Harrell",
          type: "artist",
          uri: "spotify:artist:667EyTZx1NKnqwRwhwYQYv",
        },
      ],
      title: "Snake Eater but longer title that goes on for a while",
      addedBy: "idk",
      image: {
        height: 640,
        url: "https://i.scdn.co/image/ab67616d0000b273692200d20ace9f3500171527",
        width: 640,
      },
      remainingDurationMs: undefined,
    },
  };

/**
 * Things I want to add eventually
 *
 * - Animate in with custom entries for users
 * - Custom colors for each user
 * - User flair, avatars, etc.
 * - Better animations
 */

type SpotifyTrack = GetOverlaySpotifyNowPlayingEndpointResponse["track"];

export const OverlayPage = () => {
  const [songData, setSongData] = useState<SpotifyTrack | null>(null);
  const titleContainerRef = useRef<HTMLDivElement>(null);
  const titleTextRef = useRef<HTMLSpanElement>(null);
  const [shouldMarqueeTitle, setShouldMarqueeTitle] = useState(false);

  useEffect(() => {
    document.documentElement.classList.add("overlay-transparent");

    return () => {
      document.documentElement.classList.remove("overlay-transparent");
    };
  }, []);

  // Every 10 seconds refresh
  useEffect(() => {
    const interval = setInterval(async () => {
      const { data, error } = await getOverlaySpotifyNowPlayingEndpoint();
      if (error || !data || !data.track) {
        console.error("Error fetching song data:", error);
        setSongData(SAMPLE_SPOTIFY_DATA_TEMPLATE.track);
        return;
      }

      setSongData(data.track);
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const fetchSongData = async () => {
      const { data, error } = await getOverlaySpotifyNowPlayingEndpoint();
      if (error || !data || !data.track) {
        console.error("Error fetching song data:", error);
        setSongData(SAMPLE_SPOTIFY_DATA_TEMPLATE.track);
        return;
      }
      setSongData(data.track);
    };

    fetchSongData();
  }, []);

  useLayoutEffect(() => {
    const updateTitleOverflow = () => {
      const container = titleContainerRef.current;
      const text = titleTextRef.current;

      if (!container || !text) {
        setShouldMarqueeTitle(false);
        return;
      }

      const width = container.getBoundingClientRect().width;
      setShouldMarqueeTitle(text.scrollWidth > width + 1);
    };

    updateTitleOverflow();

    const container = titleContainerRef.current;
    const text = titleTextRef.current;

    if (!container || !text || typeof ResizeObserver === "undefined") {
      return;
    }

    const resizeObserver = new ResizeObserver(updateTitleOverflow);
    resizeObserver.observe(container);
    resizeObserver.observe(text);

    return () => {
      resizeObserver.disconnect();
    };
  }, [songData?.title]);

  if (!songData) {
    return null;
  }

  const track = songData;

  if (!track) {
    return null;
  }

  const { title, artists, addedBy, image } = track;

  return (
    <div className="h-full flex flex-col items-center justify-center gap-6 px-4">
      <main className="w-full flex flex-col items-center gap-3 justify-center">
        <div className="bg-[#202c39] rounded-md overflow-hidden flex flex-row">
          {image ? (
            <img src={image.url} alt="Album Art" className="w-16 h-16" />
          ) : (
            <div className="w-16 h-16 mr-4 bg-slate-600 flex items-center justify-center">
              <MusicNoteIcon className="text-slate-400" />
            </div>
          )}
          <div
            ref={titleContainerRef}
            className="space-y-4 text-left flex items-center px-2.5 min-w-52 max-w-xs"
          >
            <div className="min-w-0 w-full">
              <div className="w-full overflow-hidden">
                {shouldMarqueeTitle ? (
                  <div className="flex w-max animate-[marquee_12s_linear_infinite]">
                    <span
                      ref={titleTextRef}
                      className="text-2xl font-semibold leading-tight text-slate-100 whitespace-nowrap shrink-0 pr-8"
                    >
                      {title || "Unknown Song"}
                    </span>
                    <span
                      aria-hidden="true"
                      className="text-2xl font-semibold leading-tight text-slate-100 whitespace-nowrap shrink-0 pr-8"
                    >
                      {title || "Unknown Song"}
                    </span>
                  </div>
                ) : (
                  <span
                    ref={titleTextRef}
                    className="text-2xl font-semibold leading-tight text-slate-100 whitespace-nowrap"
                  >
                    {title || "Unknown Song"}
                  </span>
                )}
              </div>
              <div className="text-sm">
                <span className="text-slate-400">
                  {artists[0]?.name || "Unknown Artist"}
                </span>
                {addedBy && (
                  <span className="text-amber-400">· Added by: {addedBy}</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
