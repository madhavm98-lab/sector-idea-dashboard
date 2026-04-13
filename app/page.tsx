import { Dashboard } from "@/components/dashboard";
import { prisma } from "@/lib/prisma";
import { subHours } from "date-fns";
import { IdeaView } from "@/types/idea";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function HomePage() {
  const cutoff = subHours(new Date(), 48);

  const raw = await prisma.processedIdea.findMany({
    where: {
      sourceContent: {
        publishedAt: { gte: cutoff },
      },
    },
    orderBy: { sourceContent: { publishedAt: "desc" } },
    include: { sourceContent: true },
    take: 200,
  });

  const ideas: IdeaView[] = raw.map((idea) => ({
    id: idea.id,
    title: idea.title,
    summary: idea.summary,
    thesis: idea.thesis,
    sentiment: idea.sentiment as "bullish" | "bearish" | "neutral",
    sector: idea.sector as any,
    sourceType: idea.sourceContent.sourceType as "youtube" | "reddit",
    sourceName: idea.sourceContent.sourceName,
    sourceUrl: idea.sourceContent.url,
    publishedAt: idea.sourceContent.publishedAt.toISOString(),
    confidence: idea.confidence,
    tickers: idea.tickers,
  }));

  return <Dashboard ideas={ideas} fetchedAt={new Date().toISOString()} />;
}
