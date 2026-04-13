import { prisma } from "../lib/prisma";
import { extractIdea } from "../lib/extract";

async function main() {
  const items = await prisma.sourceContent.findMany();

  for (const item of items) {
    const extracted = extractIdea({ title: item.title, body: item.body });

    const existing = await prisma.processedIdea.findFirst({
      where: { sourceContentId: item.id },
    });

    if (existing) {
      await prisma.processedIdea.update({
        where: { id: existing.id },
        data: extracted,
      });
    } else {
      await prisma.processedIdea.create({
        data: {
          sourceContentId: item.id,
          ...extracted,
        },
      });
    }
  }

  console.log(`Processed ${items.length} content items into ideas.`);
}

main()
  .then(async () => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
