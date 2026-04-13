import { PrismaClient } from "@prisma/client";
import { fetchRecentVideosAllChannels } from "@/lib/youtube";

const prisma = new PrismaClient();

async function main() {
  const videos = await fetchRecentVideosAllChannels(7);

  for (const video of videos) {
    await prisma.sourceContent.upsert({
      where: {
        url: video.url,
      },
      update: {
        externalId: video.externalId,
        sourceType: video.sourceType,
        sourceName: video.sourceName,
        author: video.author,
        title: video.title,
        body: video.body,
        publishedAt: video.publishedAt,
        metadata: video.metadata,
      },
      create: {
        externalId: video.externalId,
        sourceType: video.sourceType,
        sourceName: video.sourceName,
        author: video.author,
        title: video.title,
        body: video.body,
        url: video.url,
        publishedAt: video.publishedAt,
        metadata: video.metadata,
      },
    });
  }

  console.log(`YouTube ingestion complete: ${videos.length} videos upserted`);
}

main()
  .catch((error) => {
    console.error("YouTube ingestion failed");
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
