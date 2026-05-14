import { useEffect, useState } from "react";
import {
  getOverlaySpotifyNowPlayingEndpoint,
  type GetOverlaySpotifyNowPlayingEndpointResponse,
} from "../../api/client";
import MusicNoteIcon from "@mui/icons-material/MusicNote";
import { MarqueeText } from "../marquee-text";
import { useSearchParams } from "react-router";

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
  const [searchParams] = useSearchParams();

  const secretKey = searchParams.get("secretAugustKey");

  useEffect(() => {
    document.documentElement.classList.add("overlay-transparent");
    return () => {
      document.documentElement.classList.remove("overlay-transparent");
    };
  }, []);

  // Every 10 seconds refresh
  useEffect(() => {
    const interval = setInterval(async () => {
      if (!secretKey) {
        return;
      }

      const { data, error } = await getOverlaySpotifyNowPlayingEndpoint({
        query: {
          secretAugustKey: secretKey,
        },
      });
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
      if (!secretKey) {
        console.error("No secret key provided in query parameters");
        setSongData(SAMPLE_SPOTIFY_DATA_TEMPLATE.track);
        return;
      }

      const { data, error } = await getOverlaySpotifyNowPlayingEndpoint({
        query: {
          secretAugustKey: secretKey,
        },
      });
      if (error || !data || !data.track) {
        console.error("Error fetching song data:", error);
        setSongData(SAMPLE_SPOTIFY_DATA_TEMPLATE.track);
        return;
      }
      setSongData(data.track);
    };

    fetchSongData();
  }, []);

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
            <div className="w-16 h-16 bg-slate-600 flex items-center justify-center">
              <MusicNoteIcon className="text-slate-400" />
            </div>
          )}
          <div className="text-left flex items-center px-2.5 min-w-52 max-w-2xs">
            <div className="min-w-0 w-full">
              <MarqueeText className="text-2xl font-semibold leading-tight text-slate-100">
                {title || "Unknown Song"}
              </MarqueeText>
              <div className="text-sm">
                <span className="text-slate-400">
                  {artists[0]?.name || "Unknown Artist"}
                </span>
                {addedBy && (
                  <span className="text-amber-400"> · Added by: {addedBy}</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
