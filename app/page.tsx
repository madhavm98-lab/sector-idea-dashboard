import { IdeaCard } from "@/components/idea-card";
import { prisma } from "@/lib/prisma";
import { subHours } from "date-fns";

export default async function HomePage() {
  const cutoff = subHours(new Date(), 48);

  const ideas = await prisma.processedIdea.findMany({
    where: {
      sourceContent: {
        publishedAt: {
          gte: cutoff,
        },
      },
    },
    orderBy: {
      sourceContent: {
        publishedAt: "desc",
      },
    },
    include: {
      sourceContent: true,
    },
    take: 50,
  });

  return (
    <main className="mx-auto min-h-screen max-w-6xl px-6 py-10">
      <header className="mb-8">
        <p className="mb-2 text-sm text-cyan-400">Rolling 48-hour window</p>
        <h1 className="text-4xl font-bold tracking-tight text-white">Sector Idea Dashboard</h1>
        <p className="mt-3 max-w-2xl text-slate-400">
          Fresh idea candidates from YouTube podcasts and Reddit, grouped into consumer, internet,
          semiconductors, software, and industrials.
        </p>
      </header>

      <section className="grid gap-4 md:grid-cols-2">
        {ideas.map((idea) => (
          <IdeaCard
            key={idea.id}
            idea={{
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
            }}
          />
        ))}
      </section>

      {ideas.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-800 p-8 text-slate-400">
          No ideas found in the last 48 hours yet. Run the seed or ingestion jobs first.
        </div>
      ) : null}
    </main>
  );
}
