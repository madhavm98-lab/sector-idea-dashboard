import { prisma } from "../lib/prisma";
import { extractIdea } from "../lib/extract";

async function main() {
  await prisma.processedIdea.deleteMany();
  await prisma.sourceContent.deleteMany();

  const samples = [
    {
      externalId: "reddit-nvda-1",
      sourceType: "reddit",
      sourceName: "wallstreetbets",
      title: "Why $NVDA demand is still stronger than expected",
      body: "AI server demand remains exceptionally robust with hyperscaler capex continuing to accelerate. Supply chain checks remain firm, and TSMC's CoWoS packaging capacity is fully booked through 2025. This is extremely bullish for NVDA and the broader semiconductor supply chain including $AVGO and $MRVL.",
      url: "https://reddit.com/r/wallstreetbets/comments/nvda-bull",
      publishedAt: new Date(),
    },
    {
      externalId: "youtube-acquired-1",
      sourceType: "youtube",
      sourceName: "Acquired",
      title: "Ad tech and marketplace durability in a downturn",
      body: "Podcast discussion on digital advertising resilience and marketplace operating leverage. META and GOOGL continue to take share from linear TV. The long-term secular growth in digital advertising remains intact despite short-term cyclical headwinds.",
      url: "https://youtube.com/watch?v=acquired-ad-tech",
      publishedAt: new Date(),
    },
    {
      externalId: "reddit-tsla-short",
      sourceType: "reddit",
      sourceName: "investing",
      title: "$TSLA — pricing pressure and margin risk ahead",
      body: "Tesla's aggressive price cuts are creating serious margin compression risk. Competition from BYD is intensifying in China and Europe. Bears argue the stock is still overvalued relative to fundamentals. Short thesis: declining ASP, weakening brand, rising competition.",
      url: "https://reddit.com/r/investing/tsla-bear",
      publishedAt: new Date(),
    },
    {
      externalId: "youtube-industry-focus-1",
      sourceType: "youtube",
      sourceName: "Industry Focus",
      title: "SaaS renewal cycle and AI upsell opportunity",
      body: "Enterprise software vendors are seeing strong AI upsell attach rates. $CRM, $NOW and $WDAY are positioning AI features at premium tiers driving NRR expansion. The software sector looks bullish as AI becomes a mainstream enterprise workload.",
      url: "https://youtube.com/watch?v=saas-ai-upsell",
      publishedAt: new Date(Date.now() - 3 * 60 * 60 * 1000),
    },
    {
      externalId: "reddit-semis-bear",
      sourceType: "reddit",
      sourceName: "SecurityAnalysis",
      title: "Semiconductor cycle concerns — PC and mobile still weak",
      body: "The memory and PC end markets remain depressed. $MU and $INTC face continued inventory digestion headwinds. While AI chips are hot, the traditional semiconductor business is struggling. The cycle bottom may not be in yet — bearish on legacy semis.",
      url: "https://reddit.com/r/SecurityAnalysis/semis-bear",
      publishedAt: new Date(Date.now() - 6 * 60 * 60 * 1000),
    },
    {
      externalId: "youtube-capital-allocators",
      sourceType: "youtube",
      sourceName: "Capital Allocators",
      title: "Defense spending supercycle and industrial renaissance",
      body: "NATO allies increasing defense budgets to 2%+ GDP creates a multi-year capex supercycle for $LMT, $NOC, $RTX. Additionally, reshoring trends are driving a domestic industrial renaissance. $CAT and $DE benefit from infrastructure spending and automation adoption.",
      url: "https://youtube.com/watch?v=defense-supercycle",
      publishedAt: new Date(Date.now() - 12 * 60 * 60 * 1000),
    },
  ];

  for (const item of samples) {
    const source = await prisma.sourceContent.create({ data: item });
    const idea = extractIdea({ title: item.title, body: item.body });
    await prisma.processedIdea.create({
      data: { sourceContentId: source.id, ...idea },
    });
  }

  console.log(`Seeded ${samples.length} ideas.`);
}

main()
  .then(async () => { await prisma.$disconnect(); })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
