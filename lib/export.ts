import { IdeaView } from "@/types/idea";
import { format } from "date-fns";

export function exportToCSV(ideas: IdeaView[]): void {
  const headers = [
    "Title", "Sector", "Sentiment", "Confidence", "Tickers",
    "Summary", "Source Type", "Source Name", "Published At", "URL",
  ];

  const rows = ideas.map((idea) => [
    `"${idea.title.replace(/"/g, '""')}"`,
    idea.sector,
    idea.sentiment,
    Math.round(idea.confidence * 100) + "%",
    idea.tickers.join("; "),
    `"${idea.summary.replace(/"/g, '""')}"`,
    idea.sourceType,
    idea.sourceName,
    format(new Date(idea.publishedAt), "yyyy-MM-dd HH:mm"),
    idea.sourceUrl,
  ]);

  const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `sector-ideas-${format(new Date(), "yyyy-MM-dd-HHmm")}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function exportToMarkdown(ideas: IdeaView[]): void {
  const lines: string[] = [
    `# Sector Ideas — ${format(new Date(), "MMMM d, yyyy")}`,
    "",
    `> ${ideas.length} ideas · ${ideas.filter((i) => i.sentiment === "bullish").length} bullish · ${ideas.filter((i) => i.sentiment === "bearish").length} bearish`,
    "",
  ];

  const bySector: Record<string, IdeaView[]> = {};
  for (const idea of ideas) {
    if (!bySector[idea.sector]) bySector[idea.sector] = [];
    bySector[idea.sector].push(idea);
  }

  for (const [sector, sectorIdeas] of Object.entries(bySector)) {
    lines.push(`## ${sector.charAt(0).toUpperCase() + sector.slice(1)}`);
    lines.push("");
    for (const idea of sectorIdeas) {
      const sent = idea.sentiment === "bullish" ? "🟢" : idea.sentiment === "bearish" ? "🔴" : "🟡";
      const tickers = idea.tickers.map((t) => `\`$${t}\``).join(" ");
      lines.push(`### ${sent} ${idea.title}`);
      if (tickers) lines.push(`**Tickers:** ${tickers}`);
      lines.push(`**Confidence:** ${Math.round(idea.confidence * 100)}%  |  **Source:** ${idea.sourceName} (${idea.sourceType})`);
      lines.push("");
      lines.push(idea.summary);
      lines.push("");
      if (idea.thesis && idea.thesis !== idea.summary) {
        lines.push(`> ${idea.thesis}`);
        lines.push("");
      }
      lines.push(`[Open source](${idea.sourceUrl})`);
      lines.push("");
      lines.push("---");
      lines.push("");
    }
  }

  const md = lines.join("\n");
  const blob = new Blob([md], { type: "text/markdown;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `sector-ideas-${format(new Date(), "yyyy-MM-dd-HHmm")}.md`;
  a.click();
  URL.revokeObjectURL(url);
}
