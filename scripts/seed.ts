import { prisma } from "../lib/prisma";
import { extractIdea } from "../lib/extract";

async function main() {
  await prisma.processedIdea.deleteMany();
  await prisma.sourceContent.deleteMany();

  const samples = [
    {
      externalId: "reddit-1",
      sourceType: "reddit",
      sourceName: "wallstreetbets",
      title: "Why $NVDA demand is still stronger than expected",
      body: "Discussion around AI server demand, hyperscaler capex, and supply chain checks remaining firm.",
      url: "https://reddit.com/r/wallstreetbets",
      publishedAt: new Date(),
    },
    {
      externalId: "youtube-1",
      sourceType: "youtube",
      sourceName: "Acquired",
      title: "Ad tech and marketplace durability",
      body: "Podcast discussion on digital advertising resilience and marketplace operating leverage.",
      url: "https://youtube.com",
      publishedAt: new Date(),
    },
  ];

  for (const item of samples) {
    const source = await prisma.sourceContent.create({ data: item });
    const idea = extractIdea({ title: item.title, body: item.body });
    await prisma.processedIdea.create({
      data: {
        sourceContentId: source.id,
        ...idea,
      },
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
