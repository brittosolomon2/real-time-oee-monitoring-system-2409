"use client";

import React, { useEffect, useId } from "react";

// PUBLIC_INTERFACE
export function Modal({
  title,
  open,
  onClose,
  children,
  footer,
}: {
  /** Modal title shown in the header. */
  title: string;
  /** Whether the modal is visible. */
  open: boolean;
  /** Close callback (ESC, overlay click, or close button). */
  onClose: () => void;
  /** Modal body. */
  children: React.ReactNode;
  /** Optional footer row. */
  footer?: React.ReactNode;
}) {
  /** Accessible modal with overlay, ESC handling, and basic focus safety. */
  const titleId = useId();

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);

    // Prevent background scroll when modal is open.
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 50,
        display: "grid",
        placeItems: "center",
        padding: 16,
      }}
    >
      <button
        aria-label="Close modal overlay"
        onClick={onClose}
        style={{
          position: "absolute",
          inset: 0,
          background: "rgba(17, 24, 39, 0.45)",
          border: "none",
        }}
      />
      <div
        className="card"
        style={{
          width: "min(720px, 100%)",
          boxShadow: "var(--shadow-md)",
          position: "relative",
        }}
      >
        <div
          className="card-pad"
          style={{
            borderBottom: "1px solid var(--color-border)",
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: 12,
          }}
        >
          <div>
            <div id={titleId} style={{ fontWeight: 800, letterSpacing: "-0.02em" }}>
              {title}
            </div>
            <div className="subtle">Use ESC to close.</div>
          </div>
          <button className="btn btn-ghost" onClick={onClose}>
            Close
          </button>
        </div>

        <div className="card-pad">{children}</div>

        {footer ? (
          <div
            className="card-pad"
            style={{
              borderTop: "1px solid var(--color-border)",
              display: "flex",
              justifyContent: "flex-end",
              gap: 10,
            }}
          >
            {footer}
          </div>
        ) : null}
      </div>
    </div>
  );
}
