import { Sector } from "@/types/idea";

const sectorRules: Array<{ sector: Sector; keywords: string[] }> = [
  { sector: "consumer", keywords: ["consumer", "retail", "brand", "ecommerce", "apparel", "travel"] },
  { sector: "internet", keywords: ["internet", "ads", "marketplace", "search", "social", "streaming"] },
  { sector: "semiconductors", keywords: ["chip", "semiconductor", "gpu", "cpu", "wafer", "foundry"] },
  { sector: "software", keywords: ["software", "saas", "cloud", "ai", "developer", "cybersecurity"] },
  { sector: "industrials", keywords: ["industrial", "automation", "factory", "logistics", "aerospace", "defense"] },
];

export function classifySector(text: string): Sector {
  const lower = text.toLowerCase();
  for (const rule of sectorRules) {
    if (rule.keywords.some((keyword) => lower.includes(keyword))) {
      return rule.sector;
    }
  }
  return "software";
}
