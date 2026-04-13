import { prisma } from "@/lib/prisma";
import { subHours } from "date-fns";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const hours = Math.min(parseInt(searchParams.get("hours") ?? "48"), 168);
  const sector = searchParams.get("sector");
  const sentiment = searchParams.get("sentiment");
  const sourceType = searchParams.get("sourceType");
  const q = searchParams.get("q")?.toLowerCase();

  const cutoff = subHours(new Date(), hours);

  const ideas = await prisma.processedIdea.findMany({
    where: {
      ...(sector ? { sector } : {}),
      ...(sentiment ? { sentiment } : {}),
      sourceContent: {
        publishedAt: { gte: cutoff },
        ...(sourceType ? { sourceType } : {}),
      },
    },
    include: { sourceContent: true },
    orderBy: { sourceContent: { publishedAt: "desc" } },
    take: 200,
  });

  const filtered = q
    ? ideas.filter(
        (i) =>
          i.title.toLowerCase().includes(q) ||
          i.summary.toLowerCase().includes(q) ||
          i.tickers.some((t) => t.toLowerCase().includes(q))
      )
    : ideas;

  return Response.json({ ideas: filtered, total: filtered.length });
}
