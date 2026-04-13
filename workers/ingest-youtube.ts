import { prisma } from "../lib/prisma";
import { YOUTUBE_CHANNELS } from "../config/youtube-channels";

async function main() {
  console.log("Stub YouTube ingest starting...");
  for (const channel of YOUTUBE_CHANNELS) {
    await prisma.sourceContent.upsert({
      where: { externalId: `stub-${channel.name}` },
      update: {},
      create: {
        externalId: `stub-${channel.name}`,
        sourceType: "youtube",
        sourceName: channel.name,
        title: `Sample upload for ${channel.name}`,
        body: "Replace this stub with real YouTube Data API ingestion.",
        url: "https://youtube.com",
        publishedAt: new Date(),
      },
    });
  }
  console.log("Stub YouTube ingest complete.");
}

main()
  .then(async () => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
