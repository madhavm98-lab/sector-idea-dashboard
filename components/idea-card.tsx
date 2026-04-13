"use client";

import { IdeaView } from "@/types/idea";
import { formatDistanceToNow } from "date-fns";

const SENTIMENT_CONFIG = {
  bullish: { label: "BULL", color: "var(--bull)", bg: "var(--bull-dim)", border: "rgba(0,230,118,0.25)", icon: "▲" },
  bearish: { label: "BEAR", color: "var(--bear)", bg: "var(--bear-dim)", border: "rgba(255,69,96,0.25)", icon: "▼" },
  neutral: { label: "NTRL", color: "var(--neutral)", bg: "var(--neutral-dim)", border: "rgba(255,179,0,0.25)", icon: "◆" },
};

const SECTOR_COLORS: Record<string, string> = {
  consumer: "#a78bfa",
  internet: "#38bdf8",
  semiconductors: "#fb923c",
  software: "#34d399",
  industrials: "#fbbf24",
};

interface IdeaCardProps {
  idea: IdeaView;
  index: number;
  onExpand: (idea: IdeaView) => void;
  highlight?: string;
}

export function IdeaCard({ idea, index, onExpand, highlight }: IdeaCardProps) {
  const sentiment = SENTIMENT_CONFIG[idea.sentiment];
  const sectorColor = SECTOR_COLORS[idea.sector] ?? "#7a90b8";
  const confPct = Math.round(idea.confidence * 100);

  function highlightText(text: string): React.ReactNode {
    if (!highlight?.trim()) return text;
    const regex = new RegExp(`(${highlight.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi");
    const parts = text.split(regex);
    return parts.map((part, i) =>
      regex.test(part) ? (
        <mark key={i} style={{ background: "rgba(0,200,255,0.25)", color: "var(--accent)", borderRadius: "2px", padding: "0 1px" }}>
          {part}
        </mark>
      ) : part
    );
  }

  const isHighConf = confPct >= 80;

  return (
    <article
      className="animate-fade-in"
      style={{
        animationDelay: `${Math.min(index * 40, 300)}ms`,
        background: "var(--bg-surface)",
        border: `1px solid ${isHighConf ? `${sectorColor}30` : "var(--border)"}`,
        borderRadius: "12px",
        padding: "18px",
        display: "flex",
        flexDirection: "column",
        gap: "12px",
        transition: "border-color 0.2s, box-shadow 0.2s, transform 0.15s",
        position: "relative",
        overflow: "hidden",
        cursor: "pointer",
      }}
      onClick={() => onExpand(idea)}
      onMouseEnter={(e) => {
        const el = e.currentTarget as HTMLElement;
        el.style.borderColor = sentiment.border;
        el.style.boxShadow = `0 0 24px ${sentiment.bg}`;
        el.style.transform = "translateY(-1px)";
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget as HTMLElement;
        el.style.borderColor = isHighConf ? `${sectorColor}30` : "var(--border)";
        el.style.boxShadow = "none";
        el.style.transform = "none";
      }}
    >
      {/* Sector accent bar */}
      <div style={{ position: "absolute", top: 0, left: 0, width: "3px", height: "100%", background: sectorColor, opacity: 0.7 }} />

      {/* High confidence crown */}
      {isHighConf && (
        <div
          className="font-mono"
          style={{
            position: "absolute",
            top: "12px",
            right: "12px",
            fontSize: "9px",
            fontWeight: 600,
            letterSpacing: "0.1em",
            color: sectorColor,
            background: `${sectorColor}15`,
            border: `1px solid ${sectorColor}30`,
            borderRadius: "4px",
            padding: "2px 6px",
          }}
        >
          ★ HIGH CONF
        </div>
      )}

      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "10px" }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="font-mono" style={{ fontSize: "9px", fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: sectorColor, opacity: 0.9, marginBottom: "4px" }}>
            {idea.sector}
          </div>
          <h2 className="font-display" style={{ fontSize: "14px", fontWeight: 600, lineHeight: 1.35, color: "var(--text-primary)", margin: 0, paddingRight: isHighConf ? "60px" : "0" }}>
            {highlightText(idea.title)}
          </h2>
        </div>
        <div
          className="font-mono"
          style={{
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
            gap: "4px",
            background: sentiment.bg,
            border: `1px solid ${sentiment.border}`,
            borderRadius: "5px",
            padding: "4px 7px",
            fontSize: "10px",
            fontWeight: 600,
            color: sentiment.color,
            letterSpacing: "0.06em",
            marginTop: isHighConf ? "16px" : "0",
          }}
        >
          <span style={{ fontSize: "8px" }}>{sentiment.icon}</span>
          {sentiment.label}
        </div>
      </div>

      {/* Summary */}
      <p style={{ fontSize: "12px", lineHeight: 1.6, color: "var(--text-secondary)", margin: 0 }}>
        {highlightText(idea.summary.slice(0, 160))}
        {idea.summary.length > 160 ? "…" : ""}
      </p>

      {/* Tickers */}
      {idea.tickers.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: "5px" }}>
          {idea.tickers.map((ticker) => (
            <span
              key={ticker}
              onClick={(e) => {
                e.stopPropagation();
                window.open(`https://finance.yahoo.com/quote/${ticker}`, "_blank");
              }}
              className="font-mono"
              style={{
                fontSize: "10px",
                fontWeight: 600,
                color: "var(--accent)",
                background: "var(--accent-dim)",
                border: "1px solid rgba(0,200,255,0.2)",
                borderRadius: "3px",
                padding: "2px 6px",
                cursor: "pointer",
                transition: "background 0.12s",
              }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = "rgba(0,200,255,0.2)")}
              onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = "var(--accent-dim)")}
            >
              ${highlightText(ticker)}
            </span>
          ))}
        </div>
      )}

      {/* Footer */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "10px", paddingTop: "6px", borderTop: "1px solid var(--border-subtle)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "7px" }}>
          <div style={{ flex: 1, height: "3px", background: "var(--border)", borderRadius: "2px", overflow: "hidden", width: "60px" }}>
            <div style={{ width: `${confPct}%`, height: "100%", background: `linear-gradient(90deg,var(--accent),${sectorColor})`, borderRadius: "2px" }} />
          </div>
          <span className="font-mono" style={{ fontSize: "9px", color: "var(--text-muted)", fontWeight: 500 }}>{confPct}%</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span style={{ fontSize: "10px", color: "var(--text-muted)" }}>
            {idea.sourceType === "youtube" ? "▶" : "◉"}
          </span>
          <span style={{ fontSize: "10px", color: "var(--text-muted)" }}>{idea.sourceName}</span>
          <span style={{ color: "var(--border)", fontSize: "9px" }}>·</span>
          <span className="font-mono" style={{ fontSize: "9px", color: "var(--text-muted)" }}>
            {formatDistanceToNow(new Date(idea.publishedAt), { addSuffix: true })}
          </span>
        </div>
      </div>

      {/* Expand hint */}
      <div
        style={{
          position: "absolute",
          bottom: "12px",
          right: "14px",
          fontSize: "10px",
          color: "var(--text-muted)",
          opacity: 0,
          transition: "opacity 0.2s",
        }}
        className="expand-hint"
      >
        click to expand ↗
      </div>
      <style>{`.card-article:hover .expand-hint { opacity: 1; }`}</style>
    </article>
  );
}
