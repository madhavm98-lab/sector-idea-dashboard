import { prisma } from "../lib/prisma";
import { REDDIT_SUBREDDITS } from "../config/reddit-subreddits";

async function main() {
  console.log("Stub Reddit ingest starting...");
  for (const subreddit of REDDIT_SUBREDDITS) {
    await prisma.sourceContent.upsert({
      where: { externalId: `stub-${subreddit}` },
      update: {},
      create: {
        externalId: `stub-${subreddit}`,
        sourceType: "reddit",
        sourceName: subreddit,
        title: `Sample post from r/${subreddit}`,
        body: "Replace this stub with real Reddit API ingestion.",
        url: `https://reddit.com/r/${subreddit}`,
        publishedAt: new Date(),
      },
    });
  }
  console.log("Stub Reddit ingest complete.");
}

main()
  .then(async () => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
