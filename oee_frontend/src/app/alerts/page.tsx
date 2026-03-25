"use client";

import React, { useEffect, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { createAlertRule, listAlertRules, type AlertRule } from "@/lib/api/oee";

export default function AlertsPage() {
  const [rules, setRules] = useState<AlertRule[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    listAlertRules().then(setRules);
  }, []);

  return (
    <main>
      <header className="page-header">
        <div>
          <div className="h1">Alerts</div>
          <div className="subtle">
            Configure thresholds and view active notifications. (Scaffold)
          </div>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button className="btn btn-secondary" onClick={() => setOpen(true)}>
            New Rule
          </button>
          <button className="btn btn-ghost" onClick={() => listAlertRules().then(setRules)}>
            Refresh
          </button>
        </div>
      </header>

      <section className="grid-2">
        <div className="card">
          <div className="card-pad" style={{ display: "flex", justifyContent: "space-between" }}>
            <div>
              <div style={{ fontWeight: 800 }}>Alert rules</div>
              <div className="subtle">Thresholds that trigger in-app notifications.</div>
            </div>
          </div>
          <div className="card-pad">
            <table className="table" aria-label="Alert rules table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Scope</th>
                  <th>Threshold</th>
                  <th>Enabled</th>
                </tr>
              </thead>
              <tbody>
                {rules.map((r) => (
                  <tr key={r.id}>
                    <td style={{ fontWeight: 700 }}>{r.name}</td>
                    <td>{r.scope}</td>
                    <td>{Math.round(r.oeeThreshold * 100)}%</td>
                    <td>
                      <span
                        className="badge"
                        style={{
                          borderColor: r.enabled
                            ? "rgba(34,197,94,0.35)"
                            : "rgba(156,163,175,0.4)",
                          background: r.enabled ? "rgba(34,197,94,0.08)" : "transparent",
                        }}
                      >
                        <span
                          className="badge-dot"
                          style={{
                            background: r.enabled ? "var(--color-success)" : "#9ca3af",
                          }}
                        />
                        {r.enabled ? "Enabled" : "Disabled"}
                      </span>
                    </td>
                  </tr>
                ))}
                {rules.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="subtle" style={{ padding: 14 }}>
                      No rules configured yet.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card">
          <div className="card-pad">
            <div style={{ fontWeight: 800 }}>Active alerts</div>
            <div className="subtle">
              This panel will stream from WebSocket once backend supports it.
            </div>

            <div style={{ marginTop: 12, display: "grid", gap: 10 }}>
              <AlertItem
                severity="warning"
                title="Line B OEE trending down"
                detail="OEE hit 64% for 10 minutes. Investigate sensor fault recurrence."
              />
              <AlertItem
                severity="info"
                title="Shift report ready"
                detail="Shift 1 summary generated for Line A."
              />
            </div>
          </div>
        </div>
      </section>

      <Modal
        title="Create alert rule"
        open={open}
        onClose={() => setOpen(false)}
        footer={
          <>
            <button className="btn btn-ghost" onClick={() => setOpen(false)}>
              Cancel
            </button>
            <button className="btn btn-primary" form="rule-form" type="submit">
              Save rule
            </button>
          </>
        }
      >
        <RuleForm
          onSubmit={async (r) => {
            const created = await createAlertRule(r);
            setRules((prev) => [created, ...prev]);
            setOpen(false);
          }}
        />
      </Modal>
    </main>
  );
}

function AlertItem({
  severity,
  title,
  detail,
}: {
  severity: "info" | "warning" | "critical";
  title: string;
  detail: string;
}) {
  const color =
    severity === "critical"
      ? "var(--color-error)"
      : severity === "warning"
        ? "var(--color-secondary)"
        : "var(--color-primary)";

  return (
    <div
      className="card card-pad"
      style={{
        borderColor: "rgba(0,0,0,0.06)",
      }}
      role="status"
      aria-live="polite"
    >
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
        <div style={{ display: "grid", gap: 6 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span className="badge-dot" style={{ background: color }} aria-hidden="true" />
            <span style={{ fontWeight: 800 }}>{title}</span>
          </div>
          <div className="subtle" style={{ color: "var(--color-text)" }}>
            {detail}
          </div>
        </div>
        <span className="subtle">{new Date().toLocaleTimeString()}</span>
      </div>
    </div>
  );
}

function RuleForm({
  onSubmit,
}: {
  onSubmit: (rule: Omit<AlertRule, "id">) => Promise<void>;
}) {
  const [name, setName] = useState("New rule");
  const [scope, setScope] = useState<AlertRule["scope"]>("PLANT");
  const [threshold, setThreshold] = useState(0.7);
  const [enabled, setEnabled] = useState(true);

  return (
    <form
      id="rule-form"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit({
          name,
          scope,
          enabled,
          oeeThreshold: threshold,
        });
      }}
      style={{ display: "grid", gap: 12 }}
    >
      <div>
        <label className="label" htmlFor="name">
          Name
        </label>
        <input
          id="name"
          className="input"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Line A OEE < 75%"
        />
      </div>

      <div className="grid-2">
        <div>
          <label className="label" htmlFor="scope">
            Scope
          </label>
          <select
            id="scope"
            className="select"
            value={scope}
            onChange={(e) => setScope(e.target.value as AlertRule["scope"])}
          >
            <option value="PLANT">Plant</option>
            <option value="LINE">Line</option>
          </select>
        </div>
        <div>
          <label className="label" htmlFor="threshold">
            OEE threshold (0–1)
          </label>
          <input
            id="threshold"
            className="input"
            type="number"
            step="0.01"
            min={0}
            max={1}
            value={threshold}
            onChange={(e) => setThreshold(Number(e.target.value))}
          />
        </div>
      </div>

      <label style={{ display: "flex", alignItems: "center", gap: 10 }} className="subtle">
        <input
          type="checkbox"
          checked={enabled}
          onChange={(e) => setEnabled(e.target.checked)}
        />
        Enable rule
      </label>
    </form>
  );
}
