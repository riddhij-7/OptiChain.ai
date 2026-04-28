import { useState } from "react";
import { useApp } from "../context/AppContext";
import BlamePanel from "./BlamePanel";

const REASON_LABEL = {
  breakdown: "Vehicle / Vessel Breakdown",
  customs:   "Customs Hold",
  weather:   "Weather Event",
  vendor_fault: "Vendor Fault",
};

const REASON_COLOR = {
  breakdown:    "red",
  customs:      "amber",
  weather:      "blue",
  vendor_fault: "red",
};

function StatusDot({ status }) {
  const map = {
    completed: "dot dot-green",
    on_track:  "dot dot-green",
    delayed:   "dot dot-red",
    at_risk:   "dot dot-amber",
    pending:   "dot dot-grey",
  };
  return <span className={map[status] || "dot dot-grey"} />;
}

function StatusBadge({ status }) {
  const map = {
    completed: { label: "Completed", cls: "badge-green" },
    on_track:  { label: "On Track",  cls: "badge-green" },
    delayed:   { label: "Delayed",   cls: "badge-red" },
    at_risk:   { label: "At Risk",   cls: "badge-amber" },
    pending:   { label: "Pending",   cls: "badge-grey" },
  };
  const { label, cls } = map[status] || map.pending;
  return <span className={`badge ${cls}`}>{label}</span>;
}

function LegTimeline({ legs }) {
  return (
    <div className="leg-timeline">
      {legs.map((leg, i) => (
        <div key={leg.leg_id} className="leg-item">
          {/* Connector line */}
          {i > 0 && (
            <div className={`leg-connector ${leg.status === "delayed" ? "connector-red" : leg.status === "at_risk" ? "connector-amber" : "connector-grey"}`} />
          )}
          <div className={`leg-node ${leg.status}`}>
            <div className="leg-node-top">
              <StatusDot status={leg.status} />
              <span className="leg-seq">Leg {leg.sequence}</span>
              <span className="leg-type-icon">{leg.type === "sea" ? "🚢" : leg.type === "air" ? "✈️" : "🚛"}</span>
              <StatusBadge status={leg.status} />
            </div>
            <div className="leg-vendor">{leg.vendor_name}</div>
            <div className="leg-route">{leg.origin} → {leg.destination}</div>
            <div className="leg-eta">
              ETA: <span className={leg.status === "delayed" ? "text-red" : "text-sub"}>
                {new Date(leg.promised_eta).toLocaleDateString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
              </span>
              {leg.delay_hours && (
                <span className="delay-badge">+{leg.delay_hours}h</span>
              )}
            </div>
            {leg.delay_message && (
              <div className="leg-delay-msg">{leg.delay_message}</div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function ShipmentTracker() {
  const { state } = useApp();
  const [expanded, setExpanded] = useState(null);
  const [blameTarget, setBlameTarget] = useState(null); // { shipment, leg }

  const toggle = (id) => setExpanded(expanded === id ? null : id);

  const getWorstLeg = (shipment) =>
    shipment.legs.find((l) => l.status === "delayed") ||
    shipment.legs.find((l) => l.status === "at_risk");

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 600, letterSpacing: "-0.3px" }}>Shipment Tracker</h1>
          <p style={{ color: "var(--text-sub)", fontSize: 13, marginTop: 2 }}>
            {state.shipments.length} active shipments · live webhook monitoring
          </p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          {["on_track", "at_risk", "delayed"].map((s) => {
            const count = state.shipments.filter((sh) =>
              s === "on_track"
                ? sh.status === "on_track"
                : sh.legs.some((l) => l.status === s)
            ).length;
            return (
              <div key={s} className={`stat-chip stat-${s === "on_track" ? "green" : s === "at_risk" ? "amber" : "red"}`}>
                <span>{count}</span>
                <span>{s === "on_track" ? "On Track" : s === "at_risk" ? "At Risk" : "Delayed"}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Shipment rows */}
      <div className="shipment-list">
        {state.shipments.map((s) => {
          const worstLeg = getWorstLeg(s);
          const isOpen = expanded === s.id;
          const isDelayed = s.status === "delayed";
          const isAtRisk = !isDelayed && s.legs.some((l) => l.status === "at_risk");

          return (
            <div key={s.id} className={`shipment-card ${isDelayed ? "shipment-delayed" : isAtRisk ? "shipment-atrisk" : ""}`}>
              {/* Header row */}
              <div className="shipment-header" onClick={() => toggle(s.id)}>
                <div className="sh-left">
                  <StatusDot status={isDelayed ? "delayed" : isAtRisk ? "at_risk" : "on_track"} />
                  <div>
                    <div className="sh-id">{s.id}</div>
                    <div className="sh-title">{s.title}</div>
                  </div>
                </div>

                <div className="sh-mid">
                  <span className="sh-route">{s.origin}</span>
                  <span className="sh-arrow">→</span>
                  <span className="sh-route">{s.destination}</span>
                </div>

                <div className="sh-right">
                  <span className="sh-customer">{s.customer}</span>
                  <span className="sh-value">${s.total_value.toLocaleString()}</span>
                  {worstLeg && isDelayed && (
                    <button
                      className="blame-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        setBlameTarget({ shipment: s, leg: worstLeg });
                      }}
                    >
                      ⚡ Analyze Blame
                    </button>
                  )}
                  <StatusBadge status={isDelayed ? "delayed" : isAtRisk ? "at_risk" : "on_track"} />
                  <span className="expand-icon">{isOpen ? "▲" : "▼"}</span>
                </div>
              </div>

              {/* Delay alert bar */}
              {isDelayed && worstLeg && (
                <div className="delay-alert-bar">
                  <span className="delay-reason-tag" style={{ background: `var(--${REASON_COLOR[worstLeg.reason] || "red"}-dim)`, color: `var(--${REASON_COLOR[worstLeg.reason] || "red"})` }}>
                    {REASON_LABEL[worstLeg.reason] || worstLeg.reason}
                  </span>
                  <span className="delay-alert-msg">{worstLeg.delay_message}</span>
                </div>
              )}

              {/* Expanded leg timeline */}
              {isOpen && (
                <div className="shipment-legs">
                  <div className="section-title" style={{ marginBottom: 12 }}>Leg Breakdown</div>
                  <LegTimeline legs={s.legs} />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Blame panel overlay */}
      {blameTarget && (
        <BlamePanel
          shipment={blameTarget.shipment}
          leg={blameTarget.leg}
          onClose={() => setBlameTarget(null)}
        />
      )}
    </div>
  );
}