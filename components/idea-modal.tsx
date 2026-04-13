"use client";

import { IdeaView } from "@/types/idea";
import { format } from "date-fns";
import { useEffect, useRef } from "react";

const SENTIMENT_CONFIG = {
  bullish: { label: "BULLISH", color: "var(--bull)", bg: "var(--bull-dim)", border: "rgba(0,230,118,0.3)", icon: "▲" },
  bearish: { label: "BEARISH", color: "var(--bear)", bg: "var(--bear-dim)", border: "rgba(255,69,96,0.3)", icon: "▼" },
  neutral: { label: "NEUTRAL", color: "var(--neutral)", bg: "var(--neutral-dim)", border: "rgba(255,179,0,0.3)", icon: "◆" },
};

const SECTOR_COLORS: Record<string, string> = {
  consumer: "#a78bfa",
  internet: "#38bdf8",
  semiconductors: "#fb923c",
  software: "#34d399",
  industrials: "#fbbf24",
};

interface IdeaModalProps {
  idea: IdeaView | null;
  onClose: () => void;
}

export function IdeaModal({ idea, onClose }: IdeaModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!idea) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [idea, onClose]);

  if (!idea) return null;

  const sentiment = SENTIMENT_CONFIG[idea.sentiment];
  const sectorColor = SECTOR_COLORS[idea.sector] ?? "#7a90b8";
  const confPct = Math.round(idea.confidence * 100);

  return (
    <div
      ref={overlayRef}
      onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1000,
        background: "rgba(0,0,0,0.7)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
        animation: "fadeIn 0.2s ease",
      }}
    >
      <style>{`@keyframes fadeIn{from{opacity:0}to{opacity:1}} @keyframes slideUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:none}}`}</style>

      <div
        style={{
          background: "var(--bg-surface)",
          border: `1px solid ${sentiment.border}`,
          borderRadius: "16px",
          width: "100%",
          maxWidth: "600px",
          maxHeight: "85vh",
          overflowY: "auto",
          position: "relative",
          animation: "slideUp 0.25s ease",
          boxShadow: `0 0 40px ${sentiment.bg}, 0 20px 60px rgba(0,0,0,0.5)`,
        }}
      >
        {/* Sector accent bar */}
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "3px", background: `linear-gradient(90deg, ${sectorColor}, transparent)`, borderRadius: "16px 16px 0 0" }} />

        {/* Close button */}
        <button
          onClick={onClose}
          style={{
            position: "absolute",
            top: "16px",
            right: "16px",
            background: "var(--bg-elevated)",
            border: "1px solid var(--border)",
            borderRadius: "6px",
            color: "var(--text-muted)",
            width: "28px",
            height: "28px",
            cursor: "pointer",
            fontSize: "14px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "color 0.15s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "var(--text-primary)")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-muted)")}
        >
          ✕
        </button>

        <div style={{ padding: "28px 28px 24px" }}>
          {/* Header */}
          <div style={{ marginBottom: "20px", paddingRight: "40px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px" }}>
              <span
                className="font-mono"
                style={{
                  fontSize: "10px",
                  fontWeight: 600,
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  color: sectorColor,
                  background: `${sectorColor}15`,
                  border: `1px solid ${sectorColor}30`,
                  borderRadius: "4px",
                  padding: "3px 8px",
                }}
              >
                {idea.sector}
              </span>
              <div
                className="font-mono"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "5px",
                  background: sentiment.bg,
                  border: `1px solid ${sentiment.border}`,
                  borderRadius: "4px",
                  padding: "3px 8px",
                  fontSize: "10px",
                  fontWeight: 600,
                  color: sentiment.color,
                  letterSpacing: "0.06em",
                }}
              >
                {sentiment.icon} {sentiment.label}
              </div>
            </div>
            <h2
              className="font-display"
              style={{ fontSize: "20px", fontWeight: 700, color: "var(--text-primary)", lineHeight: 1.3, margin: 0 }}
            >
              {idea.title}
            </h2>
          </div>

          {/* Divider */}
          <div style={{ borderTop: "1px solid var(--border-subtle)", marginBottom: "20px" }} />

          {/* Summary */}
          <Section label="SUMMARY">
            <p style={{ fontSize: "14px", lineHeight: 1.7, color: "var(--text-secondary)", margin: 0 }}>
              {idea.summary}
            </p>
          </Section>

          {/* Thesis */}
          {idea.thesis && idea.thesis !== idea.summary && (
            <Section label="INVESTMENT THESIS">
              <p
                style={{
                  fontSize: "13px",
                  lineHeight: 1.7,
                  color: "var(--text-muted)",
                  margin: 0,
                  fontStyle: "italic",
                  borderLeft: `2px solid ${sectorColor}40`,
                  paddingLeft: "14px",
                }}
              >
                {idea.thesis}
              </p>
            </Section>
          )}

          {/* Tickers */}
          {idea.tickers.length > 0 && (
            <Section label="TICKERS MENTIONED">
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                {idea.tickers.map((ticker) => (
                  <a
                    key={ticker}
                    href={`https://finance.yahoo.com/quote/${ticker}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono"
                    style={{
                      fontSize: "13px",
                      fontWeight: 600,
                      color: "var(--accent)",
                      background: "var(--accent-dim)",
                      border: "1px solid rgba(0,200,255,0.25)",
                      borderRadius: "5px",
                      padding: "5px 12px",
                      textDecoration: "none",
                      transition: "background 0.15s",
                    }}
                    onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = "rgba(0,200,255,0.2)")}
                    onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = "var(--accent-dim)")}
                  >
                    ${ticker}
                  </a>
                ))}
              </div>
            </Section>
          )}

          {/* Confidence + meta */}
          <Section label="SIGNAL QUALITY">
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div
                  style={{
                    flex: 1,
                    height: "6px",
                    background: "var(--border)",
                    borderRadius: "3px",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      width: `${confPct}%`,
                      height: "100%",
                      background: `linear-gradient(90deg, var(--accent), ${sectorColor})`,
                      borderRadius: "3px",
                    }}
                  />
                </div>
                <span
                  className="font-mono"
                  style={{ fontSize: "13px", fontWeight: 600, color: "var(--accent)", minWidth: "36px" }}
                >
                  {confPct}%
                </span>
              </div>
              <p className="font-mono" style={{ fontSize: "11px", color: "var(--text-muted)", margin: 0 }}>
                Confidence based on ticker count and sentiment clarity.
                {confPct >= 80 ? " High-conviction signal." : confPct >= 65 ? " Moderate conviction." : " Low conviction — verify independently."}
              </p>
            </div>
          </Section>

          {/* Source meta */}
          <div
            style={{
              background: "var(--bg-elevated)",
              border: "1px solid var(--border-subtle)",
              borderRadius: "10px",
              padding: "14px 16px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "12px",
              marginTop: "20px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <span style={{ fontSize: "18px", color: idea.sourceType === "youtube" ? "#ff4444" : "#ff6314" }}>
                {idea.sourceType === "youtube" ? "▶" : "◉"}
              </span>
              <div>
                <div style={{ fontSize: "13px", fontWeight: 500, color: "var(--text-primary)" }}>
                  {idea.sourceName}
                </div>
                <div className="font-mono" style={{ fontSize: "10px", color: "var(--text-muted)" }}>
                  {format(new Date(idea.publishedAt), "MMM d, yyyy · HH:mm")}
                </div>
              </div>
            </div>
            <a
              href={idea.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                fontSize: "12px",
                color: "var(--accent)",
                textDecoration: "none",
                background: "var(--accent-dim)",
                border: "1px solid rgba(0,200,255,0.2)",
                borderRadius: "6px",
                padding: "7px 12px",
                transition: "background 0.15s",
                fontWeight: 500,
                whiteSpace: "nowrap",
              }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = "rgba(0,200,255,0.2)")}
              onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = "var(--accent-dim)")}
            >
              Open source ↗
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: "20px" }}>
      <div
        className="font-mono"
        style={{ fontSize: "9px", fontWeight: 600, letterSpacing: "0.15em", color: "var(--text-muted)", marginBottom: "8px" }}
      >
        {label}
      </div>
      {children}
    </div>
  );
}
