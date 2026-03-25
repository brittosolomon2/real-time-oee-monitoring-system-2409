"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { listLineStatuses, type LineStatus } from "@/lib/api/oee";
import { createOeeSocketClient, type SocketStatus } from "@/lib/ws/oeeSocket";

type OeePoint = { t: string; oee: number };

function fmtPct(v: number) {
  return `${Math.round(v * 100)}%`;
}

function statusColor(state: string) {
  if (state === "RUNNING") return "var(--color-success)";
  if (state === "STOPPED") return "var(--color-error)";
  if (state === "IDLE") return "var(--color-secondary)";
  return "#9ca3af";
}

export default function DashboardPage() {
  const [lines, setLines] = useState<LineStatus[]>([]);
  const [activeLineId, setActiveLineId] = useState<string>("line-a");
  const [socketStatus, setSocketStatus] = useState<SocketStatus>("DISCONNECTED");
  const [oeeSeries, setOeeSeries] = useState<Record<string, OeePoint[]>>({});

  useEffect(() => {
    let mounted = true;
    listLineStatuses().then((data) => {
      if (!mounted) return;
      setLines(data);
      if (!data.find((l) => l.lineId === activeLineId)) {
        setActiveLineId(data[0]?.lineId ?? "line-a");
      }
      // seed chart data
      setOeeSeries((prev) => {
        const next = { ...prev };
        for (const l of data) {
          if (!next[l.lineId]) {
            next[l.lineId] = seedSeries(l.oee);
          }
        }
        return next;
      });
    });
    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const client = createOeeSocketClient({
      onStatus: setSocketStatus,
      onMessage: (m) => {
        if (m.type === "oee_update") {
          const lineKey = `line-${String.fromCharCode(96 + Math.max(1, Math.min(3, m.line_id)))}`; // line-a..c
          const at = new Date().toISOString();

          setLines((prev) =>
            prev.map((l) =>
              l.lineId === lineKey
                ? {
                    ...l,
                    oee: m.oee.oee,
                    availability: m.oee.availability,
                    performance: m.oee.performance,
                    quality: m.oee.quality,
                    state: "RUNNING",
                    lastEventAt: at,
                  }
                : l
            )
          );

          setOeeSeries((prev) => {
            const series = prev[lineKey] ?? [];
            const next = [...series, { t: shortTime(at), oee: m.oee.oee }].slice(-24);
            return { ...prev, [lineKey]: next };
          });
        }
      },
    });

    client.start();
    return () => client.stop();
  }, []);

  const activeLine = useMemo(
    () => lines.find((l) => l.lineId === activeLineId) ?? lines[0],
    [lines, activeLineId]
  );

  const chartData = (activeLine && oeeSeries[activeLine.lineId]) || seedSeries(0.75);

  return (
    <main>
      <header className="page-header">
        <div>
          <div className="h1">Dashboard</div>
          <div className="subtle">
            Real-time OEE overview with status, KPIs, and live updates.
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <span className="badge" aria-label="WebSocket status">
            <span
              className="badge-dot"
              style={{
                background:
                  socketStatus === "CONNECTED"
                    ? "var(--color-success)"
                    : socketStatus === "CONNECTING"
                      ? "var(--color-secondary)"
                      : "var(--color-error)",
              }}
            />
            <span style={{ fontWeight: 650 }}>Live:</span>
            <span className="subtle" style={{ color: "var(--color-text)" }}>
              {socketStatus}
            </span>
          </span>

          <button
            className="btn btn-primary"
            onClick={() => window.location.assign("/events")}
          >
            Log Event
          </button>
        </div>
      </header>

      <section className="grid-3" aria-label="KPI overview">
        <KpiCard label="OEE" value={activeLine?.oee ?? 0} emphasis />
        <KpiCard label="Availability" value={activeLine?.availability ?? 0} />
        <KpiCard label="Performance" value={activeLine?.performance ?? 0} />
        <KpiCard label="Quality" value={activeLine?.quality ?? 0} />
        <div className="card card-pad" style={{ gridColumn: "span 2" }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
            <div>
              <div style={{ fontWeight: 750 }}>Line status</div>
              <div className="subtle">Select a line to view live KPIs.</div>
            </div>
            <select
              className="select"
              value={activeLineId}
              onChange={(e) => setActiveLineId(e.target.value)}
              aria-label="Select line"
              style={{ maxWidth: 240 }}
            >
              {lines.map((l) => (
                <option key={l.lineId} value={l.lineId}>
                  {l.lineName} — {l.shiftName}
                </option>
              ))}
            </select>
          </div>

          <div style={{ marginTop: 12, display: "flex", gap: 10, alignItems: "center" }}>
            <span
              className="badge"
              style={{
                borderColor: "rgba(0,0,0,0.08)",
              }}
            >
              <span
                className="badge-dot"
                style={{ background: statusColor(activeLine?.state ?? "UNKNOWN") }}
              />
              <span style={{ fontWeight: 750 }}>{activeLine?.state ?? "UNKNOWN"}</span>
            </span>
            <span className="subtle">
              Last update: {activeLine?.lastEventAt ? new Date(activeLine.lastEventAt).toLocaleString() : "—"}
            </span>
          </div>
        </div>
      </section>

      <section className="card" style={{ marginTop: 16 }}>
        <div className="card-pad" style={{ display: "flex", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontWeight: 800 }}>OEE trend (last 2 hours)</div>
            <div className="subtle">Streaming via WebSocket when available.</div>
          </div>
          <span className="badge">
            <span className="badge-dot" style={{ background: "var(--color-primary)" }} />
            <span style={{ fontWeight: 700 }}>{activeLine?.lineName ?? "—"}</span>
          </span>
        </div>

        <div style={{ height: 280, padding: "0 12px 12px 12px" }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 12, right: 20, left: 8, bottom: 0 }}>
              <CartesianGrid stroke="rgba(17,24,39,0.08)" vertical={false} />
              <XAxis dataKey="t" tick={{ fontSize: 12, fill: "#6b7280" }} />
              <YAxis
                domain={[0, 1]}
                tickFormatter={(v) => `${Math.round(v * 100)}%`}
                tick={{ fontSize: 12, fill: "#6b7280" }}
              />
              <Tooltip
                formatter={(value) => fmtPct(Number(value))}
                labelFormatter={(label) => `Time: ${label}`}
              />
              <Line
                type="monotone"
                dataKey="oee"
                stroke="var(--color-primary)"
                strokeWidth={2.4}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>
    </main>
  );
}

function KpiCard({ label, value, emphasis }: { label: string; value: number; emphasis?: boolean }) {
  return (
    <div className="card card-pad kpi" aria-label={`${label} KPI`}>
      <div className="kpi-label">{label}</div>
      <div className="kpi-value" style={{ color: emphasis ? "var(--color-primary)" : undefined }}>
        {fmtPct(value)}
      </div>
      <div className="progress" aria-hidden="true">
        <div style={{ width: `${Math.max(0, Math.min(1, value)) * 100}%` }} />
      </div>
      <div className="subtle">
        Target: <span style={{ color: "var(--color-text)", fontWeight: 650 }}>80%</span>
      </div>
    </div>
  );
}

function shortTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function seedSeries(center: number): OeePoint[] {
  const base = Math.max(0.15, Math.min(0.95, center || 0.75));
  const points: OeePoint[] = [];
  const now = Date.now();
  for (let i = 23; i >= 0; i--) {
    const t = new Date(now - i * 5 * 60_000).toISOString();
    const noise = (Math.sin(i / 2) + Math.cos(i / 3)) * 0.015;
    points.push({ t: shortTime(t), oee: Math.max(0, Math.min(1, base + noise)) });
  }
  return points;
}
