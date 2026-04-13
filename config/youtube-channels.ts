export type YouTubeCategory = "vc" | "tech" | "consumer" | "investing" | "macro";

export type YouTubeChannel = {
  name: string;
  channelId: string;
  category: YouTubeCategory;
  priority: number;
};

export const YOUTUBE_CHANNELS: YouTubeChannel[] = [
  {
    name: "Y Combinator",
    channelId: "UCcefcZRL2oaA_uBNeo5UOWg",
    category: "vc",
    priority: 5,
  },
  {
    name: "Lex Fridman",
    channelId: "UCSHZKyawb77ixDdsGog4iWA",
    category: "tech",
    priority: 5,
  },
  {
    name: "NVIDIA",
    channelId: "UCtFRv9O2AHqOZjjynzrv-xg",
    category: "tech",
    priority: 5,
  },
  {
    name: "Modern MBA",
    channelId: "UCQMyhrt92_8XM0KgZH6VnRg",
    category: "consumer",
    priority: 4,
  },
  {
    name: "All-In Podcast",
    channelId: "UCESLZhusAkFfsNsApnjF_Cg",
    category: "macro",
    priority: 5,
  },
];
