import { prisma } from "@/lib/prisma";
import { subHours } from "date-fns";

export async function GET() {
  const cutoff = subHours(new Date(), 48);

  const ideas = await prisma.processedIdea.findMany({
    where: {
      sourceContent: {
        publishedAt: { gte: cutoff },
      },
    },
    include: { sourceContent: true },
    orderBy: { sourceContent: { publishedAt: "desc" } },
    take: 50,
  });

  return Response.json({ ideas });
}
