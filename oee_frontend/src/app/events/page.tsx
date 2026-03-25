"use client";

import React, { useMemo, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import {
  createEventLog,
  listEventLogs,
  type EventLogEntry,
} from "@/lib/api/oee";

type Tab = "PRODUCTION" | "DOWNTIME" | "QUALITY";

export default function EventsPage() {
  const [tab, setTab] = useState<Tab>("PRODUCTION");
  const [open, setOpen] = useState(false);

  const [entries, setEntries] = useState<EventLogEntry[]>([]);
  const filtered = useMemo(() => entries.filter((e) => e.type === tab), [entries, tab]);

  React.useEffect(() => {
    listEventLogs().then(setEntries);
  }, []);

  return (
    <main>
      <header className="page-header">
        <div>
          <div className="h1">Event Logging</div>
          <div className="subtle">
            Log production, downtime, and quality events. (API wiring scaffolded)
          </div>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button className="btn btn-secondary" onClick={() => setOpen(true)}>
            New Event
          </button>
          <button className="btn btn-ghost" onClick={() => listEventLogs().then(setEntries)}>
            Refresh
          </button>
        </div>
      </header>

      <section className="card" style={{ marginBottom: 16 }}>
        <div className="card-pad" style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <TabButton active={tab === "PRODUCTION"} onClick={() => setTab("PRODUCTION")}>
            Production
          </TabButton>
          <TabButton active={tab === "DOWNTIME"} onClick={() => setTab("DOWNTIME")}>
            Downtime
          </TabButton>
          <TabButton active={tab === "QUALITY"} onClick={() => setTab("QUALITY")}>
            Quality
          </TabButton>
        </div>
      </section>

      <section className="card">
        <div className="card-pad">
          <table className="table" aria-label="Event log table">
            <thead>
              <tr>
                <th>Time</th>
                <th>Line</th>
                <th>Type</th>
                <th>Details</th>
                <th>Note</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="subtle" style={{ padding: 14 }}>
                    No entries for this category yet.
                  </td>
                </tr>
              ) : (
                filtered.map((e) => (
                  <tr key={e.id}>
                    <td>{new Date(e.at).toLocaleString()}</td>
                    <td>{e.lineId}</td>
                    <td style={{ fontWeight: 700 }}>{e.type}</td>
                    <td className="subtle" style={{ color: "var(--color-text)" }}>
                      {e.type === "PRODUCTION" ? (
                        <>Qty: <b>{e.quantity ?? 0}</b></>
                      ) : e.type === "QUALITY" ? (
                        <>Scrap: <b>{e.scrap ?? 0}</b> / Qty: <b>{e.quantity ?? 0}</b></>
                      ) : (
                        <>
                          {e.category ?? "—"} / {e.reason ?? "—"}
                        </>
                      )}
                    </td>
                    <td className="subtle" style={{ color: "var(--color-text)" }}>
                      {e.note ?? "—"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <Modal
        title="New event entry"
        open={open}
        onClose={() => setOpen(false)}
        footer={
          <>
            <button className="btn btn-ghost" onClick={() => setOpen(false)}>
              Cancel
            </button>
            <button
              className="btn btn-primary"
              form="event-form"
              type="submit"
            >
              Save
            </button>
          </>
        }
      >
        <EventForm
          defaultType={tab}
          onSubmit={async (entry) => {
            const created = await createEventLog(entry);
            setEntries((prev) => [created, ...prev]);
            setOpen(false);
          }}
        />
      </Modal>
    </main>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      className="btn"
      onClick={onClick}
      style={{
        background: active ? "rgba(37, 99, 235, 0.10)" : "transparent",
        border: `1px solid ${active ? "rgba(37, 99, 235, 0.45)" : "var(--color-border)"}`,
        color: active ? "var(--color-primary)" : "var(--color-text)",
      }}
    >
      {children}
    </button>
  );
}

function EventForm({
  defaultType,
  onSubmit,
}: {
  defaultType: "PRODUCTION" | "DOWNTIME" | "QUALITY";
  onSubmit: (entry: Omit<EventLogEntry, "id">) => Promise<void>;
}) {
  const [type, setType] = useState<EventLogEntry["type"]>(defaultType);
  const [lineId, setLineId] = useState("line-a");
  const [quantity, setQuantity] = useState<number>(0);
  const [scrap, setScrap] = useState<number>(0);
  const [category, setCategory] = useState("Unplanned");
  const [reason, setReason] = useState("—");
  const [note, setNote] = useState("");

  return (
    <form
      id="event-form"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit({
          at: new Date().toISOString(),
          lineId,
          type,
          quantity: type === "PRODUCTION" || type === "QUALITY" ? quantity : undefined,
          scrap: type === "QUALITY" ? scrap : undefined,
          category: type === "DOWNTIME" ? category : undefined,
          reason: type === "DOWNTIME" ? reason : undefined,
          note: note || undefined,
        });
      }}
      style={{ display: "grid", gap: 12 }}
    >
      <div className="grid-2">
        <div>
          <label className="label" htmlFor="type">
            Type
          </label>
          <select
            id="type"
            className="select"
            value={type}
            onChange={(e) => setType(e.target.value as EventLogEntry["type"])}
          >
            <option value="PRODUCTION">Production</option>
            <option value="DOWNTIME">Downtime</option>
            <option value="QUALITY">Quality</option>
          </select>
        </div>
        <div>
          <label className="label" htmlFor="line">
            Line
          </label>
          <select id="line" className="select" value={lineId} onChange={(e) => setLineId(e.target.value)}>
            <option value="line-a">Line A</option>
            <option value="line-b">Line B</option>
            <option value="line-c">Line C</option>
          </select>
        </div>
      </div>

      {type === "DOWNTIME" ? (
        <div className="grid-2">
          <div>
            <label className="label" htmlFor="category">
              Category
            </label>
            <input
              id="category"
              className="input"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="Planned / Unplanned"
            />
          </div>
          <div>
            <label className="label" htmlFor="reason">
              Reason
            </label>
            <input
              id="reason"
              className="input"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Reason code or description"
            />
          </div>
        </div>
      ) : null}

      {type === "PRODUCTION" ? (
        <div>
          <label className="label" htmlFor="qty">
            Quantity produced
          </label>
          <input
            id="qty"
            className="input"
            type="number"
            min={0}
            value={quantity}
            onChange={(e) => setQuantity(Number(e.target.value))}
          />
        </div>
      ) : null}

      {type === "QUALITY" ? (
        <div className="grid-2">
          <div>
            <label className="label" htmlFor="qtyq">
              Quantity checked
            </label>
            <input
              id="qtyq"
              className="input"
              type="number"
              min={0}
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
            />
          </div>
          <div>
            <label className="label" htmlFor="scrap">
              Scrap
            </label>
            <input
              id="scrap"
              className="input"
              type="number"
              min={0}
              value={scrap}
              onChange={(e) => setScrap(Number(e.target.value))}
            />
          </div>
        </div>
      ) : null}

      <div>
        <label className="label" htmlFor="note">
          Note (optional)
        </label>
        <textarea
          id="note"
          className="textarea"
          rows={4}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Context for supervisors / shift handover..."
        />
      </div>
    </form>
  );
}
