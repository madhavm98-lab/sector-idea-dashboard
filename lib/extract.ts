import { classifySector } from "@/lib/classify";

type ExtractInput = {
  title: string;
  body: string;
};

const BEARISH_PATTERN =
  /\b(bear|bearish|downside|short|risk|overvalued|decline|drop|fall|sell|avoid|weak|headwind|miss|disappoint|concern|worry|warning|cut|lower)\b/i;

const BULLISH_PATTERN =
  /\b(bull|bullish|upside|long|winner|growth|buy|outperform|beat|accelerat|strong|tailwind|opportunity|upsid|upgrade|raise|higher|catalyst|momentum)\b/i;

export function extractIdea(input: ExtractInput) {
  const text = `${input.title} ${input.body}`.trim();
  const sector = classifySector(text);

  // Count matches for more nuanced scoring
  const bearMatches = (text.match(new RegExp(BEARISH_PATTERN.source, "gi")) ?? []).length;
  const bullMatches = (text.match(new RegExp(BULLISH_PATTERN.source, "gi")) ?? []).length;

  const sentiment =
    bearMatches > bullMatches ? "bearish" : bullMatches > bearMatches ? "bullish" : "neutral";

  // Extract tickers: $NVDA, $TSLA, or bare uppercase 1-5 letters that look like tickers
  const dollarTickers = (text.match(/\$[A-Z]{1,5}\b/g) ?? []).map((t) => t.replace("$", ""));
  const bareTickers = (text.match(/\b([A-Z]{2,5})\b/g) ?? []).filter(
    // filter out common false positives
    (t) => !["AI", "IPO", "CEO", "CFO", "IT", "US", "UK", "EU", "GDP", "ETF", "PC", "TV", "AR", "VR", "API"].includes(t)
  );

  const tickers = Array.from(new Set([...dollarTickers, ...bareTickers])).slice(0, 6);

  // Confidence: base + tickers boost + sentiment clarity boost
  const clarityBoost = Math.abs(bullMatches - bearMatches) * 0.02;
  const tickerBoost = Math.min(tickers.length * 0.04, 0.2);
  const confidence = Math.min(0.95, 0.45 + tickerBoost + clarityBoost);

  // Better summary: prefer first full sentence of body
  const firstSentence = input.body.split(/[.!?]/)[0]?.trim();
  const summary =
    firstSentence && firstSentence.length > 30
      ? firstSentence.slice(0, 240)
      : input.body.slice(0, 240) || input.title;

  return {
    title: input.title.slice(0, 140),
    summary,
    thesis: text.slice(0, 360),
    sector,
    sentiment,
    tickers,
    confidence,
  };
}
