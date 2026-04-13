import { Sector } from "@/types/idea";

const sectorRules: Array<{ sector: Sector; keywords: string[] }> = [
  {
    sector: "semiconductors",
    keywords: [
      "chip", "semiconductor", "gpu", "cpu", "wafer", "foundry", "tsmc", "asic",
      "nvidia", "amd", "intel", "arm", "qualcomm", "broadcom", "micron", "hbm",
      "memory", "nand", "dram", "silicon", "fab", "node", "lithography",
    ],
  },
  {
    sector: "software",
    keywords: [
      "software", "saas", "cloud", "ai", "developer", "cybersecurity", "api",
      "platform", "subscription", "arr", "nrr", "churn", "microsoft", "salesforce",
      "adobe", "servicenow", "workday", "datadog", "crowdstrike", "snowflake",
      "machine learning", "llm", "openai", "enterprise software",
    ],
  },
  {
    sector: "internet",
    keywords: [
      "internet", "ads", "marketplace", "search", "social", "streaming", "google",
      "meta", "amazon", "advertising", "digital media", "e-commerce", "platform",
      "user growth", "engagement", "monetisation", "monetization", "tiktok", "youtube",
      "spotify", "netflix", "uber", "airbnb", "pinterest", "snap",
    ],
  },
  {
    sector: "consumer",
    keywords: [
      "consumer", "retail", "brand", "ecommerce", "apparel", "travel", "restaurant",
      "food", "beverage", "luxury", "nike", "apple", "amazon", "starbucks", "mcdonald",
      "shopify", "etsy", "discretionary", "spending", "wallet", "lifestyle",
    ],
  },
  {
    sector: "industrials",
    keywords: [
      "industrial", "automation", "factory", "logistics", "aerospace", "defense",
      "manufacturing", "supply chain", "energy", "infrastructure", "utility",
      "construction", "rail", "shipping", "caterpillar", "deere", "ge", "honeywell",
      "lockheed", "northrop", "raytheon", "ups", "fedex",
    ],
  },
];

export function classifySector(text: string): Sector {
  const lower = text.toLowerCase();
  const scores: Record<Sector, number> = {
    semiconductors: 0,
    software: 0,
    internet: 0,
    consumer: 0,
    industrials: 0,
  };

  for (const rule of sectorRules) {
    for (const keyword of rule.keywords) {
      if (lower.includes(keyword)) {
        // Multi-word keywords score higher
        scores[rule.sector] += keyword.includes(" ") ? 2 : 1;
      }
    }
  }

  const best = (Object.entries(scores) as [Sector, number][]).sort((a, b) => b[1] - a[1])[0];
  return best[1] > 0 ? best[0] : "software";
}
