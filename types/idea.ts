export const SECTORS = [
  "consumer",
  "internet",
  "semiconductors",
  "software",
  "industrials",
] as const;

export type Sector = (typeof SECTORS)[number];

export type SourceType = "youtube" | "reddit";

export type IdeaView = {
  id: string;
  title: string;
  summary: string;
  thesis: string;
  sentiment: "bullish" | "bearish" | "neutral";
  sector: Sector;
  sourceType: SourceType;
  sourceName: string;
  sourceUrl: string;
  publishedAt: string;
  confidence: number;
  tickers: string[];
};
