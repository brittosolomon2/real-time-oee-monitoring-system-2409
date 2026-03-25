"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";

/**
 * Simple inline icons (no external icon dependency).
 */
function Icon({ name }: { name: "dashboard" | "events" | "alerts" | "reports" }) {
  const common = "w-4 h-4";
  switch (name) {
    case "dashboard":
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M4 13.5c0-5.2 3.6-9.5 8-9.5s8 4.3 8 9.5v6.5H4v-6.5Z"
            stroke="currentColor"
            strokeWidth="1.8"
          />
          <path
            d="M12 13V7.5"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </svg>
      );
    case "events":
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M7 3v4M17 3v4M4.5 9.2h15"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          <path
            d="M6.5 21h11c1.1 0 2-.9 2-2V8.5c0-1.1-.9-2-2-2h-11c-1.1 0-2 .9-2 2V19c0 1.1.9 2 2 2Z"
            stroke="currentColor"
            strokeWidth="1.8"
          />
          <path
            d="M8 12.5h8M8 15.5h8M8 18.5h5"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </svg>
      );
    case "alerts":
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M12 3a7 7 0 0 1 7 7v4.3l1.3 2.3c.4.7-.1 1.6-.9 1.6H4.6c-.8 0-1.3-.9-.9-1.6L5 14.3V10a7 7 0 0 1 7-7Z"
            stroke="currentColor"
            strokeWidth="1.8"
          />
          <path
            d="M9.5 20a2.5 2.5 0 0 0 5 0"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </svg>
      );
    case "reports":
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M7 3h7l3 3v15a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z"
            stroke="currentColor"
            strokeWidth="1.8"
          />
          <path
            d="M14 3v4h4"
            stroke="currentColor"
            strokeWidth="1.8"
          />
          <path
            d="M8 12h8M8 15.5h8M8 19h6"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </svg>
      );
  }
}

type NavItem = {
  href: string;
  label: string;
  icon: "dashboard" | "events" | "alerts" | "reports";
  description: string;
};

const navItems: NavItem[] = [
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: "dashboard",
    description: "Real-time OEE & status",
  },
  {
    href: "/events",
    label: "Event Logging",
    icon: "events",
    description: "Production / downtime / quality",
  },
  {
    href: "/alerts",
    label: "Alerts",
    icon: "alerts",
    description: "Thresholds & notifications",
  },
  {
    href: "/reporting",
    label: "Reporting",
    icon: "reports",
    description: "Shift handover & analytics",
  },
];

// PUBLIC_INTERFACE
export default function AppShell({ children }: { children: React.ReactNode }) {
  /** Main application shell: fixed sidebar + content area. */
  const pathname = usePathname();
  const activeHref = useMemo(() => {
    // Highlight parent route (e.g. /reporting/details still highlights /reporting)
    const match = navItems
      .map((i) => i.href)
      .sort((a, b) => b.length - a.length)
      .find((href) => pathname === href || pathname.startsWith(href + "/"));
    return match ?? "/dashboard";
  }, [pathname]);

  return (
    <div className="app-shell">
      <aside className="sidebar" aria-label="Primary navigation">
        <div className="card card-pad" style={{ marginBottom: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              aria-hidden="true"
              style={{
                width: 36,
                height: 36,
                borderRadius: 12,
                background: "linear-gradient(135deg, var(--color-primary), #60a5fa)",
                boxShadow: "var(--shadow-sm)",
              }}
            />
            <div>
              <div style={{ fontWeight: 750, letterSpacing: "-0.02em" }}>
                OEE Monitor
              </div>
              <div className="subtle">Ocean Professional</div>
            </div>
          </div>
        </div>

        <nav className="card" aria-label="Modules">
          <div className="card-pad" style={{ display: "grid", gap: 6 }}>
            {navItems.map((item) => {
              const active = activeHref === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={clsx("btn", "btn-ghost")}
                  style={{
                    justifyContent: "flex-start",
                    borderColor: active ? "rgba(37, 99, 235, 0.45)" : "var(--color-border)",
                    background: active ? "rgba(37, 99, 235, 0.10)" : "transparent",
                  }}
                  aria-current={active ? "page" : undefined}
                >
                  <span
                    aria-hidden="true"
                    style={{
                      color: active ? "var(--color-primary)" : "var(--color-muted)",
                      display: "inline-flex",
                    }}
                  >
                    <Icon name={item.icon} />
                  </span>
                  <span style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                    <span style={{ fontWeight: 700 }}>{item.label}</span>
                    <span className="subtle">{item.description}</span>
                  </span>
                </Link>
              );
            })}
          </div>
        </nav>

        <div style={{ marginTop: 14 }} className="card card-pad">
          <div className="subtle">
            Backend connectivity is scaffolded (REST + WebSocket). Configure{" "}
            <code>NEXT_PUBLIC_OEE_API_BASE_URL</code> and{" "}
            <code>NEXT_PUBLIC_OEE_WS_URL</code>.
          </div>
        </div>
      </aside>

      <div className="main">
        {children}
        <footer style={{ marginTop: 18 }} className="subtle">
          UI scaffold (step 01.00). Live data wiring will be enabled once backend
          endpoints are available.
        </footer>
      </div>
    </div>
  );
}
