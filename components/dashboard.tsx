"use client";

import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { IdeaView, SECTORS, Sector } from "@/types/idea";
import { IdeaCard } from "@/components/idea-card";
import { IdeaModal } from "@/components/idea-modal";
import { exportToCSV, exportToMarkdown } from "@/lib/export";
import { formatDistanceToNow } from "date-fns";

const SENTIMENT_OPTIONS = ["all", "bullish", "bearish", "neutral"] as const;
const SOURCE_OPTIONS = ["all", "youtube", "reddit"] as const;
const TIME_WINDOWS = [
  { label: "24H", hours: 24 },
  { label: "48H", hours: 48 },
  { label: "7D",  hours: 168 },
] as const;
const REFRESH_INTERVALS = [
  { label: "Off",  ms: 0 },
  { label: "1m",   ms: 60_000 },
  { label: "5m",   ms: 300_000 },
] as const;

const SECTOR_ICONS: Record<string, string> = {
  consumer: "🛍", internet: "🌐", semiconductors: "⬡", software: "◈", industrials: "⚙",
};
const SECTOR_COLORS: Record<string, string> = {
  consumer: "#a78bfa", internet: "#38bdf8", semiconductors: "#fb923c", software: "#34d399", industrials: "#fbbf24",
};

interface DashboardProps {
  ideas: IdeaView[];
  fetchedAt: string;
}

export function Dashboard({ ideas: initialIdeas, fetchedAt: initialFetchedAt }: DashboardProps) {
  const [ideas, setIdeas]             = useState<IdeaView[]>(initialIdeas);
  const [fetchedAt, setFetchedAt]     = useState(initialFetchedAt);
  const [loading, setLoading]         = useState(false);
  const [hours, setHours]             = useState(48);
  const [sectorFilter, setSector]     = useState<Sector | "all">("all");
  const [sentimentFilter, setSent]    = useState<typeof SENTIMENT_OPTIONS[number]>("all");
  const [sourceFilter, setSrc]        = useState<typeof SOURCE_OPTIONS[number]>("all");
  const [search, setSearch]           = useState("");
  const [sortBy, setSort]             = useState<"time" | "confidence">("time");
  const [refreshMs, setRefreshMs]     = useState(0);
  const [countdown, setCountdown]     = useState(0);
  const [selectedIdea, setSelected]   = useState<IdeaView | null>(null);
  const [sidebarOpen, setSidebar]     = useState(false);
  const [exportOpen, setExportOpen]   = useState(false);
  const refreshTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const countdownTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Fetch ─────────────────────────────────────────────────────────────────
  const fetchIdeas = useCallback(async (h: number) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/ideas?hours=${h}`);
      if (!res.ok) throw new Error("Fetch failed");
      const data = await res.json();
      setIdeas(data.ideas.map((idea: any) => ({
        id: idea.id,
        title: idea.title,
        summary: idea.summary,
        thesis: idea.thesis,
        sentiment: idea.sentiment,
        sector: idea.sector,
        sourceType: idea.sourceContent.sourceType,
        sourceName: idea.sourceContent.sourceName,
        sourceUrl: idea.sourceContent.url,
        publishedAt: idea.sourceContent.publishedAt,
        confidence: idea.confidence,
        tickers: idea.tickers,
      })));
      setFetchedAt(new Date().toISOString());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  // Refetch on hours change
  useEffect(() => { fetchIdeas(hours); }, [hours, fetchIdeas]);

  // Auto-refresh
  useEffect(() => {
    if (refreshTimer.current) clearInterval(refreshTimer.current);
    if (countdownTimer.current) clearInterval(countdownTimer.current);
    if (!refreshMs) { setCountdown(0); return; }
    setCountdown(refreshMs / 1000);
    refreshTimer.current = setInterval(() => fetchIdeas(hours), refreshMs);
    countdownTimer.current = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) return refreshMs / 1000;
        return c - 1;
      });
    }, 1000);
    return () => {
      if (refreshTimer.current) clearInterval(refreshTimer.current);
      if (countdownTimer.current) clearInterval(countdownTimer.current);
    };
  }, [refreshMs, hours, fetchIdeas]);

  // ── Computed stats ────────────────────────────────────────────────────────
  const sectorStats = useMemo(() => {
    const s: Record<string, { total: number; bull: number; bear: number; neutral: number }> = {};
    for (const sec of SECTORS) s[sec] = { total: 0, bull: 0, bear: 0, neutral: 0 };
    for (const idea of ideas) {
      if (s[idea.sector]) {
        s[idea.sector].total++;
        if (idea.sentiment === "bullish") s[idea.sector].bull++;
        else if (idea.sentiment === "bearish") s[idea.sector].bear++;
        else s[idea.sector].neutral++;
      }
    }
    return s;
  }, [ideas]);

  const maxSectorCount = useMemo(() => Math.max(...Object.values(sectorStats).map((c) => c.total), 1), [sectorStats]);

  const tickerFreq = useMemo(() => {
    const freq: Record<string, number> = {};
    for (const idea of ideas) {
      for (const t of idea.tickers) freq[t] = (freq[t] ?? 0) + 1;
    }
    return Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, 8);
  }, [ideas]);

  const bullCount = ideas.filter((i) => i.sentiment === "bullish").length;
  const bearCount = ideas.filter((i) => i.sentiment === "bearish").length;
  const avgConf   = ideas.length ? Math.round(ideas.reduce((s, i) => s + i.confidence, 0) / ideas.length * 100) : 0;

  const filtered = useMemo(() => {
    let list = [...ideas];
    if (sectorFilter !== "all") list = list.filter((i) => i.sector === sectorFilter);
    if (sentimentFilter !== "all") list = list.filter((i) => i.sentiment === sentimentFilter);
    if (sourceFilter !== "all") list = list.filter((i) => i.sourceType === sourceFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (i) => i.title.toLowerCase().includes(q) || i.summary.toLowerCase().includes(q) || i.tickers.some((t) => t.toLowerCase().includes(q))
      );
    }
    if (sortBy === "confidence") list.sort((a, b) => b.confidence - a.confidence);
    return list;
  }, [ideas, sectorFilter, sentimentFilter, sourceFilter, search, sortBy]);

  const hasFilters = sectorFilter !== "all" || sentimentFilter !== "all" || sourceFilter !== "all" || search.trim().length > 0;
  const clearFilters = useCallback(() => { setSector("all"); setSent("all"); setSrc("all"); setSearch(""); }, []);

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <>
      <IdeaModal idea={selectedIdea} onClose={() => setSelected(null)} />

      <div style={{ minHeight: "100vh" }}>
        {/* ── TOP HEADER ──────────────────────────────────────────────────── */}
        <header style={{ borderBottom: "1px solid var(--border)", background: "rgba(8,15,31,0.95)", backdropFilter: "blur(12px)", position: "sticky", top: 0, zIndex: 100, padding: "0 20px" }}>
          <div style={{ maxWidth: "1440px", margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", height: "52px", gap: "16px" }}>
            {/* Logo */}
            <div style={{ display: "flex", alignItems: "center", gap: "12px", flexShrink: 0 }}>
              {/* Mobile sidebar toggle */}
              <button
                onClick={() => setSidebar((o) => !o)}
                style={{ display: "none", background: "none", border: "none", color: "var(--text-muted)", fontSize: "16px", cursor: "pointer", padding: "4px" }}
                className="mobile-sidebar-toggle"
              >
                ☰
              </button>
              <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: loading ? "var(--neutral)" : "var(--accent)" }} className={loading ? "" : "pulse-dot"} />
              <h1 className="font-display" style={{ fontSize: "15px", fontWeight: 700, color: "var(--text-primary)", margin: 0, letterSpacing: "0.04em" }}>
                SECTOR IDEAS
              </h1>
              <span className="font-mono" style={{ fontSize: "9px", color: "var(--text-muted)", letterSpacing: "0.1em", paddingLeft: "12px", borderLeft: "1px solid var(--border)" }}>
                {loading ? "REFRESHING…" : formatDistanceToNow(new Date(fetchedAt), { addSuffix: true })}
              </span>
            </div>

            {/* Center: time window + refresh */}
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              {/* Time window pills */}
              <div style={{ display: "flex", background: "var(--bg-elevated)", borderRadius: "8px", padding: "3px", border: "1px solid var(--border)" }}>
                {TIME_WINDOWS.map((tw) => (
                  <button
                    key={tw.hours}
                    onClick={() => setHours(tw.hours)}
                    className="font-mono"
                    style={{
                      padding: "4px 10px",
                      borderRadius: "5px",
                      border: "none",
                      cursor: "pointer",
                      fontSize: "11px",
                      fontWeight: 600,
                      letterSpacing: "0.06em",
                      transition: "all 0.15s",
                      background: hours === tw.hours ? "var(--accent)" : "transparent",
                      color: hours === tw.hours ? "#000" : "var(--text-muted)",
                    }}
                  >
                    {tw.label}
                  </button>
                ))}
              </div>

              {/* Auto-refresh */}
              <div style={{ display: "flex", background: "var(--bg-elevated)", borderRadius: "8px", padding: "3px", border: "1px solid var(--border)" }}>
                {REFRESH_INTERVALS.map((ri) => (
                  <button
                    key={ri.ms}
                    onClick={() => setRefreshMs(ri.ms)}
                    className="font-mono"
                    style={{
                      padding: "4px 10px",
                      borderRadius: "5px",
                      border: "none",
                      cursor: "pointer",
                      fontSize: "11px",
                      transition: "all 0.15s",
                      background: refreshMs === ri.ms ? "var(--bg-surface)" : "transparent",
                      color: refreshMs === ri.ms ? "var(--text-primary)" : "var(--text-muted)",
                    }}
                  >
                    {refreshMs === ri.ms && countdown > 0 && ri.ms > 0 ? `${countdown}s` : ri.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Right: stats + export */}
            <div style={{ display: "flex", alignItems: "center", gap: "20px", flexShrink: 0 }}>
              <HeaderStat label="IDEAS" value={ideas.length} />
              <HeaderStat label="BULL"  value={bullCount} color="var(--bull)" />
              <HeaderStat label="BEAR"  value={bearCount} color="var(--bear)" />
              <HeaderStat label="CONF"  value={`${avgConf}%`} color="var(--accent)" />

              {/* Export dropdown */}
              <div style={{ position: "relative" }}>
                <button
                  onClick={() => setExportOpen((o) => !o)}
                  className="font-mono"
                  style={{
                    padding: "6px 12px",
                    background: "var(--bg-elevated)",
                    border: "1px solid var(--border)",
                    borderRadius: "7px",
                    color: "var(--text-secondary)",
                    fontSize: "11px",
                    cursor: "pointer",
                    letterSpacing: "0.06em",
                    transition: "border-color 0.15s",
                  }}
                  onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.borderColor = "var(--accent)")}
                  onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.borderColor = "var(--border)")}
                >
                  ↓ EXPORT
                </button>
                {exportOpen && (
                  <div
                    style={{
                      position: "absolute",
                      right: 0,
                      top: "calc(100% + 6px)",
                      background: "var(--bg-elevated)",
                      border: "1px solid var(--border)",
                      borderRadius: "8px",
                      overflow: "hidden",
                      zIndex: 200,
                      minWidth: "140px",
                      boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
                    }}
                  >
                    {[
                      { label: "Export CSV", action: () => { exportToCSV(filtered); setExportOpen(false); } },
                      { label: "Export Markdown", action: () => { exportToMarkdown(filtered); setExportOpen(false); } },
                    ].map(({ label, action }) => (
                      <button
                        key={label}
                        onClick={action}
                        style={{
                          display: "block",
                          width: "100%",
                          padding: "10px 14px",
                          background: "transparent",
                          border: "none",
                          textAlign: "left",
                          color: "var(--text-secondary)",
                          fontSize: "12px",
                          cursor: "pointer",
                          transition: "background 0.1s, color 0.1s",
                          fontFamily: "'DM Sans', sans-serif",
                        }}
                        onMouseEnter={(e) => {
                          (e.currentTarget as HTMLElement).style.background = "var(--bg-surface)";
                          (e.currentTarget as HTMLElement).style.color = "var(--text-primary)";
                        }}
                        onMouseLeave={(e) => {
                          (e.currentTarget as HTMLElement).style.background = "transparent";
                          (e.currentTarget as HTMLElement).style.color = "var(--text-secondary)";
                        }}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* ── BODY ────────────────────────────────────────────────────────── */}
        <div
          style={{
            maxWidth: "1440px",
            margin: "0 auto",
            display: "grid",
            gridTemplateColumns: "220px 1fr",
            minHeight: "calc(100vh - 52px)",
          }}
        >
          {/* ── SIDEBAR ─────────────────────────────────────────────────── */}
          <aside
            style={{
              borderRight: "1px solid var(--border)",
              padding: "20px 14px",
              background: "rgba(8,15,31,0.5)",
              position: "sticky",
              top: "52px",
              height: "calc(100vh - 52px)",
              overflowY: "auto",
              display: "flex",
              flexDirection: "column",
              gap: "24px",
            }}
          >
            {/* Sector filter + ratio bars */}
            <div>
              <SideLabel>SECTORS</SideLabel>
              <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
                {/* All */}
                <SectorButton
                  active={sectorFilter === "all"}
                  onClick={() => setSector("all")}
                  count={ideas.length}
                  maxCount={ideas.length}
                  color="var(--accent)"
                  icon="◉"
                  label="All Sectors"
                  bull={bullCount}
                  bear={bearCount}
                />
                {SECTORS.map((s) => {
                  const st = sectorStats[s];
                  return (
                    <SectorButton
                      key={s}
                      active={sectorFilter === s}
                      onClick={() => setSector(s)}
                      count={st.total}
                      maxCount={maxSectorCount}
                      color={SECTOR_COLORS[s]}
                      icon={SECTOR_ICONS[s]}
                      label={s.charAt(0).toUpperCase() + s.slice(1)}
                      bull={st.bull}
                      bear={st.bear}
                    />
                  );
                })}
              </div>
            </div>

            {/* Sentiment */}
            <div>
              <SideLabel>SENTIMENT</SideLabel>
              <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
                {SENTIMENT_OPTIONS.map((s) => {
                  const cnt = s === "all" ? ideas.length : ideas.filter((i) => i.sentiment === s).length;
                  const isActive = sentimentFilter === s;
                  const clr = s === "bullish" ? "var(--bull)" : s === "bearish" ? "var(--bear)" : s === "neutral" ? "var(--neutral)" : "var(--text-secondary)";
                  return (
                    <SideButton key={s} active={isActive} onClick={() => setSent(s)} color={isActive ? clr : undefined}>
                      <span>{s === "bullish" ? "▲ " : s === "bearish" ? "▼ " : s === "neutral" ? "◆ " : ""}
                        {s === "all" ? "All" : s.charAt(0).toUpperCase() + s.slice(1)}</span>
                      <span style={{ opacity: 0.5, fontSize: "10px" }}>{cnt}</span>
                    </SideButton>
                  );
                })}
              </div>
            </div>

            {/* Source */}
            <div>
              <SideLabel>SOURCE</SideLabel>
              <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
                {SOURCE_OPTIONS.map((s) => {
                  const cnt = s === "all" ? ideas.length : ideas.filter((i) => i.sourceType === s).length;
                  return (
                    <SideButton key={s} active={sourceFilter === s} onClick={() => setSrc(s)}>
                      <span>{s === "youtube" ? "▶ " : s === "reddit" ? "◉ " : ""}{s === "all" ? "All" : s.charAt(0).toUpperCase() + s.slice(1)}</span>
                      <span style={{ opacity: 0.5, fontSize: "10px" }}>{cnt}</span>
                    </SideButton>
                  );
                })}
              </div>
            </div>

            {/* Sort */}
            <div>
              <SideLabel>SORT BY</SideLabel>
              <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
                <SideButton active={sortBy === "time"} onClick={() => setSort("time")}>
                  <span>⏱ Recent first</span>
                </SideButton>
                <SideButton active={sortBy === "confidence"} onClick={() => setSort("confidence")}>
                  <span>★ Confidence</span>
                </SideButton>
              </div>
            </div>

            {/* Hot tickers */}
            {tickerFreq.length > 0 && (
              <div>
                <SideLabel>HOT TICKERS</SideLabel>
                <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                  {tickerFreq.map(([ticker, count]) => (
                    <div key={ticker} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <button
                        onClick={() => setSearch(ticker)}
                        className="font-mono"
                        style={{
                          fontSize: "11px",
                          fontWeight: 600,
                          color: "var(--accent)",
                          background: "var(--accent-dim)",
                          border: "1px solid rgba(0,200,255,0.15)",
                          borderRadius: "4px",
                          padding: "2px 7px",
                          cursor: "pointer",
                          transition: "background 0.12s",
                          flexShrink: 0,
                        }}
                        onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = "rgba(0,200,255,0.18)")}
                        onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = "var(--accent-dim)")}
                      >
                        ${ticker}
                      </button>
                      <div style={{ flex: 1, height: "2px", background: "var(--border)", borderRadius: "1px", overflow: "hidden" }}>
                        <div style={{ width: `${(count / tickerFreq[0][1]) * 100}%`, height: "100%", background: "var(--accent)", opacity: 0.5, borderRadius: "1px" }} />
                      </div>
                      <span className="font-mono" style={{ fontSize: "9px", color: "var(--text-muted)", minWidth: "12px" }}>{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </aside>

          {/* ── MAIN PANEL ──────────────────────────────────────────────── */}
          <main style={{ padding: "20px 24px", overflow: "auto" }}>
            {/* Search + result count */}
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "14px" }}>
              <div style={{ flex: 1, position: "relative" }}>
                <span style={{ position: "absolute", left: "11px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)", fontSize: "14px", pointerEvents: "none" }}>⌕</span>
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search titles, summaries, tickers…"
                  style={{
                    width: "100%",
                    background: "var(--bg-surface)",
                    border: "1px solid var(--border)",
                    borderRadius: "8px",
                    padding: "8px 12px 8px 30px",
                    fontSize: "13px",
                    color: "var(--text-primary)",
                    outline: "none",
                    transition: "border-color 0.2s",
                    fontFamily: "'DM Sans', sans-serif",
                  }}
                  onFocus={(e) => ((e.target as HTMLElement).style.borderColor = "var(--accent)")}
                  onBlur={(e) => ((e.target as HTMLElement).style.borderColor = "var(--border)")}
                />
              </div>
              <span className="font-mono" style={{ fontSize: "11px", color: "var(--text-muted)", whiteSpace: "nowrap", background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: "7px", padding: "8px 12px" }}>
                {filtered.length} / {ideas.length}
              </span>
              {hasFilters && (
                <button
                  onClick={clearFilters}
                  style={{ padding: "8px 12px", background: "transparent", border: "1px solid var(--border)", borderRadius: "7px", fontSize: "12px", color: "var(--text-muted)", cursor: "pointer", transition: "color 0.15s, border-color 0.15s", fontFamily: "'DM Sans', sans-serif", whiteSpace: "nowrap" }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--bear)"; (e.currentTarget as HTMLElement).style.borderColor = "var(--bear)"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--text-muted)"; (e.currentTarget as HTMLElement).style.borderColor = "var(--border)"; }}
                >
                  ✕ Clear
                </button>
              )}
            </div>

            {/* Active filter pills */}
            {hasFilters && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "14px" }}>
                {sectorFilter !== "all" && <FilterPill label={`Sector: ${sectorFilter}`} onRemove={() => setSector("all")} />}
                {sentimentFilter !== "all" && <FilterPill label={`Sentiment: ${sentimentFilter}`} onRemove={() => setSent("all")} />}
                {sourceFilter !== "all" && <FilterPill label={`Source: ${sourceFilter}`} onRemove={() => setSrc("all")} />}
                {search && <FilterPill label={`"${search}"`} onRemove={() => setSearch("")} />}
              </div>
            )}

            {/* Loading overlay */}
            {loading && (
              <div className="font-mono" style={{ textAlign: "center", padding: "12px", fontSize: "11px", color: "var(--text-muted)", letterSpacing: "0.12em", marginBottom: "12px", background: "var(--accent-dim)", border: "1px solid rgba(0,200,255,0.15)", borderRadius: "8px" }}>
                ⟳ FETCHING NEW DATA…
              </div>
            )}

            {/* Card grid */}
            {filtered.length > 0 ? (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(360px, 1fr))", gap: "12px" }}>
                {filtered.map((idea, i) => (
                  <IdeaCard
                    key={idea.id}
                    idea={idea}
                    index={i}
                    onExpand={setSelected}
                    highlight={search}
                  />
                ))}
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "80px 20px", gap: "14px", border: "1px dashed var(--border)", borderRadius: "12px" }}>
                <div style={{ fontSize: "28px", opacity: 0.25 }}>◈</div>
                <p className="font-mono" style={{ fontSize: "11px", color: "var(--text-muted)", textAlign: "center", margin: 0 }}>
                  {ideas.length === 0 ? "NO IDEAS IN THIS WINDOW — RUN SEED OR INGEST WORKERS" : "NO RESULTS FOR CURRENT FILTERS"}
                </p>
                {hasFilters && (
                  <button
                    onClick={clearFilters}
                    style={{ fontSize: "12px", color: "var(--accent)", background: "none", border: "1px solid rgba(0,200,255,0.3)", borderRadius: "6px", padding: "6px 14px", cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}
                  >
                    Clear all filters
                  </button>
                )}
              </div>
            )}
          </main>
        </div>
      </div>
    </>
  );
}

// ── Sub-components ──────────────────────────────────────────────────────────

function HeaderStat({ label, value, color }: { label: string; value: string | number; color?: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
      <span className="font-mono" style={{ fontSize: "8px", color: "var(--text-muted)", letterSpacing: "0.14em" }}>{label}</span>
      <span className="font-mono" style={{ fontSize: "13px", fontWeight: 600, color: color ?? "var(--text-primary)", lineHeight: 1.1 }}>{value}</span>
    </div>
  );
}

function SideLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="font-mono" style={{ fontSize: "8px", fontWeight: 600, letterSpacing: "0.16em", color: "var(--text-muted)", marginBottom: "7px", textTransform: "uppercase" }}>
      {children}
    </div>
  );
}

function SectorButton({ active, onClick, count, maxCount, color, icon, label, bull, bear }: {
  active: boolean; onClick: () => void; count: number; maxCount: number; color: string; icon: string; label: string; bull: number; bear: number;
}) {
  const pct = (count / maxCount) * 100;
  const bullPct = count > 0 ? (bull / count) * 100 : 0;
  const bearPct = count > 0 ? (bear / count) * 100 : 0;

  return (
    <button
      onClick={onClick}
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "5px",
        padding: "7px 8px",
        borderRadius: "6px",
        border: active ? `1px solid ${color}30` : "1px solid transparent",
        cursor: "pointer",
        background: active ? `${color}10` : "transparent",
        transition: "all 0.15s",
        width: "100%",
        textAlign: "left",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: "12px", color: active ? color : "var(--text-secondary)", fontFamily: "'DM Sans', sans-serif", fontWeight: active ? 500 : 400 }}>
          {icon} {label}
        </span>
        <span className="font-mono" style={{ fontSize: "10px", color: active ? color : "var(--text-muted)", opacity: 0.8 }}>{count}</span>
      </div>
      {/* Total bar */}
      <div style={{ height: "2px", background: "var(--border)", borderRadius: "1px", overflow: "hidden" }}>
        <div style={{ width: `${pct}%`, height: "100%", background: color, opacity: active ? 0.8 : 0.35, borderRadius: "1px", transition: "width 0.4s ease" }} />
      </div>
      {/* Bull/bear ratio */}
      {count > 0 && (
        <div style={{ height: "2px", background: "var(--border)", borderRadius: "1px", overflow: "hidden", display: "flex" }}>
          <div style={{ width: `${bullPct}%`, height: "100%", background: "var(--bull)", opacity: 0.6 }} />
          <div style={{ width: `${bearPct}%`, height: "100%", background: "var(--bear)", opacity: 0.6 }} />
        </div>
      )}
    </button>
  );
}

function SideButton({ active, onClick, color, children }: { active: boolean; onClick: () => void; color?: string; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className="font-mono"
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "5px 8px",
        borderRadius: "5px",
        border: "none",
        cursor: "pointer",
        fontSize: "11px",
        letterSpacing: "0.07em",
        background: active ? "var(--bg-elevated)" : "transparent",
        color: active ? (color ?? "var(--text-primary)") : "var(--text-muted)",
        transition: "all 0.15s",
        width: "100%",
        textAlign: "left",
      }}
    >
      {children}
    </button>
  );
}

function FilterPill({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <div className="font-mono" style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "11px", color: "var(--text-secondary)", background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: "20px", padding: "3px 10px 3px 12px" }}>
      {label}
      <button onClick={onRemove} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", fontSize: "11px", padding: 0, lineHeight: 1 }}>×</button>
    </div>
  );
}
