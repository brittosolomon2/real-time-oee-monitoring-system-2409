import { apiRequest } from "./client";

export type HealthResponse = unknown;

export type LineStatus = {
  lineId: string;
  lineName: string;
  shiftName: string;
  oee: number; // 0..1
  availability: number; // 0..1
  performance: number; // 0..1
  quality: number; // 0..1
  state: "RUNNING" | "STOPPED" | "IDLE" | "UNKNOWN";
  lastEventAt: string;
};

export type EventLogEntry = {
  id: string;
  at: string;
  lineId: string;
  type: "PRODUCTION" | "DOWNTIME" | "QUALITY";
  category?: string;
  reason?: string;
  quantity?: number;
  scrap?: number;
  note?: string;
};

export type AlertRule = {
  id: string;
  name: string;
  enabled: boolean;
  oeeThreshold: number; // 0..1
  scope: "LINE" | "PLANT";
};

export type ShiftReport = {
  id: string;
  shiftName: string;
  lineName: string;
  from: string;
  to: string;
  summary: string;
  kpis: {
    oee: number;
    availability: number;
    performance: number;
    quality: number;
  };
};

// PUBLIC_INTERFACE
export async function getHealth(): Promise<HealthResponse> {
  /** Calls backend health check. */
  return apiRequest<HealthResponse>("/");
}

/**
 * The backend OpenAPI currently only exposes the root health endpoint.
 * The following functions are scaffolds for the full system and will be
 * wired once backend endpoints are implemented.
 */

// PUBLIC_INTERFACE
export async function listLineStatuses(): Promise<LineStatus[]> {
  /** Fetch real-time line statuses (scaffold). */
  return Promise.resolve(mockLineStatuses());
}

// PUBLIC_INTERFACE
export async function listEventLogs(): Promise<EventLogEntry[]> {
  /** Fetch event log entries (scaffold). */
  return Promise.resolve(mockEventLogs());
}

// PUBLIC_INTERFACE
export async function createEventLog(entry: Omit<EventLogEntry, "id">): Promise<EventLogEntry> {
  /** Create a new event log entry (scaffold). */
  return Promise.resolve({ ...entry, id: `evt_${Math.random().toString(16).slice(2)}` });
}

// PUBLIC_INTERFACE
export async function listAlertRules(): Promise<AlertRule[]> {
  /** Fetch alert rules (scaffold). */
  return Promise.resolve(mockAlertRules());
}

// PUBLIC_INTERFACE
export async function createAlertRule(rule: Omit<AlertRule, "id">): Promise<AlertRule> {
  /** Create a new alert rule (scaffold). */
  return Promise.resolve({ ...rule, id: `al_${Math.random().toString(16).slice(2)}` });
}

// PUBLIC_INTERFACE
export async function listShiftReports(): Promise<ShiftReport[]> {
  /** Fetch shift handover reports (scaffold). */
  return Promise.resolve(mockShiftReports());
}

function mockLineStatuses(): LineStatus[] {
  const now = new Date().toISOString();
  return [
    {
      lineId: "line-a",
      lineName: "Line A",
      shiftName: "Shift 1",
      oee: 0.78,
      availability: 0.86,
      performance: 0.9,
      quality: 0.98,
      state: "RUNNING",
      lastEventAt: now,
    },
    {
      lineId: "line-b",
      lineName: "Line B",
      shiftName: "Shift 1",
      oee: 0.61,
      availability: 0.72,
      performance: 0.85,
      quality: 0.99,
      state: "STOPPED",
      lastEventAt: now,
    },
    {
      lineId: "line-c",
      lineName: "Line C",
      shiftName: "Shift 2",
      oee: 0.83,
      availability: 0.9,
      performance: 0.92,
      quality: 1,
      state: "RUNNING",
      lastEventAt: now,
    },
  ];
}

function mockEventLogs(): EventLogEntry[] {
  const now = Date.now();
  return [
    {
      id: "evt_1",
      at: new Date(now - 12 * 60_000).toISOString(),
      lineId: "line-b",
      type: "DOWNTIME",
      category: "Unplanned",
      reason: "Sensor fault",
      note: "Auto-stop after intermittent signal.",
    },
    {
      id: "evt_2",
      at: new Date(now - 45 * 60_000).toISOString(),
      lineId: "line-a",
      type: "PRODUCTION",
      quantity: 240,
      note: "Hourly count logged.",
    },
    {
      id: "evt_3",
      at: new Date(now - 85 * 60_000).toISOString(),
      lineId: "line-c",
      type: "QUALITY",
      scrap: 3,
      quantity: 180,
      note: "Minor scrap due to label misalignment.",
    },
  ];
}

function mockAlertRules(): AlertRule[] {
  return [
    { id: "al_1", name: "Plant OEE < 70%", enabled: true, oeeThreshold: 0.7, scope: "PLANT" },
    { id: "al_2", name: "Line B OEE < 65%", enabled: true, oeeThreshold: 0.65, scope: "LINE" },
  ];
}

function mockShiftReports(): ShiftReport[] {
  const from = new Date(Date.now() - 8 * 60 * 60_000).toISOString();
  const to = new Date().toISOString();
  return [
    {
      id: "rep_1",
      shiftName: "Shift 1",
      lineName: "Line A",
      from,
      to,
      summary:
        "Stable throughput, no major downtime. Quality steady; monitor minor vibration trend on station 3.",
      kpis: { oee: 0.78, availability: 0.86, performance: 0.9, quality: 0.98 },
    },
    {
      id: "rep_2",
      shiftName: "Shift 1",
      lineName: "Line B",
      from,
      to,
      summary:
        "Two unplanned stops. Recommend maintenance inspection of sensor harness and recalibration.",
      kpis: { oee: 0.61, availability: 0.72, performance: 0.85, quality: 0.99 },
    },
  ];
}
