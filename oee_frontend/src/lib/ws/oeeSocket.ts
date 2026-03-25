export type SocketStatus = "DISCONNECTED" | "CONNECTING" | "CONNECTED";

export type LiveUpdateMessage =
  | {
      type: "oee_update";
      line_id: number;
      run_id: number;
      oee: {
        availability: number;
        performance: number;
        quality: number;
        oee: number;
        good_count: number;
        scrap_count: number;
        downtime_s: number;
        runtime_s: number;
        planned_production_time_s: number;
      };
    }
  | {
      type: "alert";
      alert: {
        id: number;
        severity: "info" | "warning" | "critical";
        message: string;
        created_at: string;
        line_id: number;
        run_id?: number | null;
        shift_id?: number | null;
        type: string;
        acknowledged_at?: string | null;
      };
    };

function getWsUrl(lineId?: string): string {
  // Expected to be ws(s)://host:port/path
  const base =
    process.env.NEXT_PUBLIC_OEE_WS_URL ||
    process.env.NEXT_PUBLIC_WS_URL ||
    "ws://localhost:3001";
  const normalized = base.replace(/\/$/, "");
  // Backend endpoint is /ws/oee?line_id=...
  const url = `${normalized}/ws/oee?line_id=${encodeURIComponent(lineId ?? "1")}`;
  return url;
}

// PUBLIC_INTERFACE
export function createOeeSocketClient({
  onStatus,
  onMessage,
}: {
  /** Called on connection status changes. */
  onStatus?: (s: SocketStatus) => void;
  /** Called when a message arrives (JSON expected). */
  onMessage?: (m: LiveUpdateMessage) => void;
}) {
  /**
   * WebSocket client scaffold with exponential backoff reconnect.
   * The backend doesn't expose a websocket in current OpenAPI; this is UI wiring.
   */
  let ws: WebSocket | null = null;
  let status: SocketStatus = "DISCONNECTED";
  let stopped = false;

  let retry = 0;
  let retryTimer: number | null = null;

  const setStatus = (s: SocketStatus) => {
    status = s;
    onStatus?.(s);
  };

  const clearRetry = () => {
    if (retryTimer) window.clearTimeout(retryTimer);
    retryTimer = null;
  };

  const connect = () => {
    if (stopped) return;
    clearRetry();
    setStatus("CONNECTING");

    try {
      ws = new WebSocket(getWsUrl("1"));
    } catch {
      scheduleReconnect();
      return;
    }

    ws.onopen = () => {
      retry = 0;
      setStatus("CONNECTED");
    };

    ws.onclose = () => {
      setStatus("DISCONNECTED");
      scheduleReconnect();
    };

    ws.onerror = () => {
      // Let onclose handle reconnect. Some browsers fire both.
    };

    ws.onmessage = (evt) => {
      try {
        const parsed = JSON.parse(String(evt.data)) as LiveUpdateMessage;
        onMessage?.(parsed);
      } catch {
        // Ignore non-json messages.
      }
    };
  };

  const scheduleReconnect = () => {
    if (stopped) return;
    clearRetry();
    retry += 1;
    const delay = Math.min(15_000, 500 * Math.pow(2, retry));
    retryTimer = window.setTimeout(connect, delay);
  };

  return {
    // PUBLIC_INTERFACE
    start() {
      /** Start (or restart) the websocket connection. */
      stopped = false;
      connect();
    },
    // PUBLIC_INTERFACE
    stop() {
      /** Stop reconnection and close current socket if present. */
      stopped = true;
      clearRetry();
      if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) {
        ws.close();
      }
      ws = null;
      setStatus("DISCONNECTED");
    },
    // PUBLIC_INTERFACE
    send(data: unknown) {
      /** Send JSON message if connected. */
      if (!ws || ws.readyState !== WebSocket.OPEN) return false;
      ws.send(JSON.stringify(data));
      return true;
    },
    // PUBLIC_INTERFACE
    getStatus() {
      /** Get current socket status. */
      return status;
    },
  };
}
