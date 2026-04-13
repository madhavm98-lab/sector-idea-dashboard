import { classifySector } from "@/lib/classify";

type ExtractInput = {
  title: string;
  body: string;
};

export function extractIdea(input: ExtractInput) {
  const text = `${input.title} ${input.body}`.trim();
  const sector = classifySector(text);
  const sentiment = /bear|downside|short|risk/i.test(text)
    ? "bearish"
    : /bull|upside|long|winner|growth/i.test(text)
      ? "bullish"
      : "neutral";

  const tickers = Array.from(new Set((text.match(/\$[A-Z]{1,5}\b/g) ?? []).map((t) => t.replace("$", ""))));

  return {
    title: input.title.slice(0, 140),
    summary: input.body.slice(0, 220) || input.title,
    thesis: text.slice(0, 320),
    sector,
    sentiment,
    tickers,
    confidence: Math.min(0.95, 0.55 + tickers.length * 0.05),
  };
}
