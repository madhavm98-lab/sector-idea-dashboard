import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { fetchRecentVideosAllChannels } from "@/lib/youtube";

const prisma = new PrismaClient();

export async function GET() {
  try {
    const videos = await fetchRecentVideosAllChannels(7);

    for (const video of videos) {
      await prisma.sourceContent.upsert({
        where: { url: video.url },
        update: {
          sourceType: video.sourceType,
          sourceName: video.sourceName,
          author: video.author,
          title: video.title,
          body: video.body,
          publishedAt: video.publishedAt,
          metadata: video.metadata,
        },
        create: {
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

    return NextResponse.json({
      ok: true,
      count: videos.length,
      videos: videos.slice(0, 5).map((video) => ({
        title: video.title,
        url: video.url,
        publishedAt: video.publishedAt,
        sourceName: video.sourceName,
        windowTags: video.metadata.windowTags,
      })),
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  } finally {
    await prisma.$disconnect();
  }
}
