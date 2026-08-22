import type React from "react";

interface Metric { id: string; label: string; value: string; trend: string; trendUp: boolean; }
interface Chart { id: string; title: string; color: string; points: { label: string; value: number }[]; }

const METRICS: Metric[] = [
  { id: "users", label: "Total Users", value: "12,847", trend: "+12.4%", trendUp: true },
  { id: "sessions", label: "Active Sessions", value: "1,203", trend: "+8.1%", trendUp: true },
  { id: "revenue", label: "Revenue", value: "$48,290", trend: "+15.7%", trendUp: true },
  { id: "events", label: "Events / Day", value: "89,421", trend: "-2.3%", trendUp: false },
];

const CHARTS: Chart[] = [
  { id: "signups", title: "New Signups (last 14 days)", color: "#4CAF50", points: Array.from({ length: 14 }, (_, i) => ({ label: `d${i + 1}`, value: 40 + Math.round(Math.random() * 60) })) },
  { id: "sessions-c", title: "Sessions (last 14 days)", color: "#2196F3", points: Array.from({ length: 14 }, (_, i) => ({ label: `d${i + 1}`, value: 80 + Math.round(Math.random() * 90) })) },
  { id: "revenue-c", title: "Revenue (last 14 days)", color: "#FF9800", points: Array.from({ length: 14 }, (_, i) => ({ label: `d${i + 1}`, value: 500 + Math.round(Math.random() * 400) })) },
];

const CARD: React.CSSProperties = { background: "var(--vscode-editorWidget-background, #252526)", border: "1px solid var(--vscode-panel-border)", borderRadius: 6, padding: 12 };
const CHART_H = 140;

const BarChart = ({ chart }: { chart: Chart }) => {
  const max = Math.max(...chart.points.map((p) => p.value), 1);
  return (
    <div style={CARD}>
      <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 8, color: "var(--vscode-foreground)" }}>{chart.title}</div>
      <div style={{ display: "flex", alignItems: "flex-end", gap: 4, height: CHART_H }}>
        {chart.points.map((p) => (
          <div key={p.label} style={{ flex: 1, height: "100%", display: "flex", alignItems: "flex-end" }}>
            <div title={`${p.label}: ${p.value}`} style={{ width: "100%", height: `${Math.round((p.value / max) * 100)}%`, background: chart.color, borderRadius: "2px 2px 0 0", minHeight: 4, opacity: 0.85 }} />
          </div>
        ))}
      </div>
      <div style={{ display: "flex", gap: 4, marginTop: 4 }}>
        {chart.points.map((p) => <div key={p.label} style={{ flex: 1, fontSize: 9, textAlign: "center", color: "var(--vscode-descriptionForeground)" }}>{p.label}</div>)}
      </div>
    </div>
  );
};

/** Simple Firebase Analytics dashboard (placeholder data). */
export const AnalyticsPage = () => (
  <div style={{ height: "100%", overflow: "auto", padding: 16 }}>
    <div style={{ display: "flex", alignItems: "center", marginBottom: 16 }}>
      <i className="codicon codicon-graph-line" style={{ fontSize: 18, marginRight: 8, color: "var(--vscode-charts-blue)" }} />
      <h2 style={{ fontSize: 16, margin: 0, color: "var(--vscode-foreground)" }}>Analytics</h2>
    </div>
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 10, marginBottom: 16 }}>
      {METRICS.map((m) => (
        <div key={m.id} style={CARD}>
          <div style={{ fontSize: 11, color: "var(--vscode-descriptionForeground)" }}>{m.label}</div>
          <div style={{ fontSize: 22, fontWeight: 700, margin: "4px 0", color: "var(--vscode-foreground)" }}>{m.value}</div>
          <div style={{ fontSize: 11, color: m.trendUp ? "var(--vscode-testing-iconPassed)" : "var(--vscode-testing-iconFailed)" }}>
            <i className={`codicon codicon-arrow-${m.trendUp ? "up" : "down"}`} style={{ fontSize: 11 }} /> {m.trend}
          </div>
        </div>
      ))}
    </div>
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 12 }}>
      {CHARTS.map((c) => <BarChart key={c.id} chart={c} />)}
    </div>
    <div style={{ marginTop: 16, fontSize: 11, color: "var(--vscode-descriptionForeground)" }}>
      Data shown is sampled placeholder analytics. Connect a live data source to see real metrics.
    </div>
  </div>
);