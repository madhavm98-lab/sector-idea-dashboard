import {
  YOUTUBE_CHANNELS,
  type YouTubeCategory,
  type YouTubeChannel,
} from "@/config/youtube-channels";

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;

type YouTubeSearchItem = {
  id?: {
    kind?: string;
    videoId?: string;
  };
  snippet?: {
    publishedAt?: string;
    channelId?: string;
    title?: string;
    description?: string;
    channelTitle?: string;
  };
};

type YouTubeSearchResponse = {
  items?: YouTubeSearchItem[];
};

export type NormalizedYouTubeVideo = {
  sourceType: "youtube";
  sourceName: string;
  author: string;
  title: string;
  body: string;
  url: string;
  publishedAt: Date;
  externalId: string;
  metadata: {
    channelId: string;
    category: YouTubeCategory;
    priority: number;
    windowTags: ("48H" | "7D")[];
  };
};

export function getWindowTags(publishedAt: Date): ("48H" | "7D")[] {
  const now = Date.now();
  const diffMs = now - publishedAt.getTime();
  const diffHours = diffMs / (1000 * 60 * 60);

  const tags: ("48H" | "7D")[] = [];
  if (diffHours <= 48) tags.push("48H");
  if (diffHours <= 168) tags.push("7D");
  return tags;
}

export async function fetchRecentVideosForChannel(
  channel: YouTubeChannel,
  lookbackDays = 7,
): Promise<NormalizedYouTubeVideo[]> {
  if (!YOUTUBE_API_KEY) {
    throw new Error("Missing YOUTUBE_API_KEY");
  }

  const publishedAfter = new Date(
    Date.now() - lookbackDays * 24 * 60 * 60 * 1000,
  ).toISOString();

  const url = new URL("https://www.googleapis.com/youtube/v3/search");
  url.searchParams.set("key", YOUTUBE_API_KEY);
  url.searchParams.set("channelId", channel.channelId);
  url.searchParams.set("part", "snippet");
  url.searchParams.set("order", "date");
  url.searchParams.set("maxResults", "10");
  url.searchParams.set("publishedAfter", publishedAfter);
  url.searchParams.set("type", "video");

  const res = await fetch(url.toString(), {
    method: "GET",
    headers: { Accept: "application/json" },
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`YouTube API error for ${channel.name}: ${res.status} ${text}`);
  }

  const data = (await res.json()) as YouTubeSearchResponse;
  const items = data.items ?? [];

  return items
    .map((item) => {
      const videoId = item.id?.videoId;
      const snippet = item.snippet;

      if (!videoId || !snippet?.title || !snippet.publishedAt) {
        return null;
      }

      const publishedAt = new Date(snippet.publishedAt);
      const windowTags = getWindowTags(publishedAt);

      if (windowTags.length === 0) {
        return null;
      }

      return {
        sourceType: "youtube" as const,
        sourceName: channel.name,
        author: snippet.channelTitle ?? channel.name,
        title: snippet.title,
        body: snippet.description ?? "",
        url: `https://www.youtube.com/watch?v=${videoId}`,
        publishedAt,
        externalId: videoId,
        metadata: {
          channelId: channel.channelId,
          category: channel.category,
          priority: channel.priority,
          windowTags,
        },
      };
    })
    .filter((item): item is NormalizedYouTubeVideo => item !== null);
}

export async function fetchRecentVideosAllChannels(
  lookbackDays = 7,
): Promise<NormalizedYouTubeVideo[]> {
  const settled = await Promise.allSettled(
    YOUTUBE_CHANNELS.map((channel) =>
      fetchRecentVideosForChannel(channel, lookbackDays),
    ),
  );

  const successes = settled
    .filter(
      (result): result is PromiseFulfilledResult<NormalizedYouTubeVideo[]> =>
        result.status === "fulfilled",
    )
    .flatMap((result) => result.value);

  return successes.sort(
    (a, b) => b.publishedAt.getTime() - a.publishedAt.getTime(),
  );
}


