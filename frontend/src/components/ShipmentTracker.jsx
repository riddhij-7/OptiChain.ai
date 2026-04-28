import { useState } from "react";
import { useApp } from "../context/AppContext";
import BlamePanel from "./BlamePanel";
import {
  Ship, Plane, Truck, Package,
  ChevronDown, ChevronUp,
  Zap, AlertTriangle, CloudLightning, FileX, ShieldAlert,
} from "lucide-react";

const REASON_LABEL = {
  breakdown:    "Vehicle / Vessel Breakdown",
  customs:      "Customs Hold",
  weather:      "Weather Event",
  vendor_fault: "Vendor Fault",
};

const REASON_COLOR = {
  breakdown:    "red",
  customs:      "amber",
  weather:      "blue",
  vendor_fault: "red",
};

const REASON_ICON = {
  breakdown:    <Truck        size={11} strokeWidth={2} />,
  customs:      <FileX        size={11} strokeWidth={2} />,
  weather:      <CloudLightning size={11} strokeWidth={2} />,
  vendor_fault: <ShieldAlert  size={11} strokeWidth={2} />,
};

const TYPE_ICON = {
  sea:  <Ship  size={13} strokeWidth={1.7} />,
  air:  <Plane size={13} strokeWidth={1.7} />,
  road: <Truck size={13} strokeWidth={1.7} />,
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
          {i > 0 && (
            <div className={`leg-connector ${
              leg.status === "delayed" ? "connector-red" :
              leg.status === "at_risk" ? "connector-amber" : "connector-grey"
            }`} />
          )}
          <div className={`leg-node ${leg.status}`}>
            <div className="leg-node-top">
              <StatusDot status={leg.status} />
              <span className="leg-seq">Leg {leg.sequence}</span>
              <span className="leg-type-icon">
                {TYPE_ICON[leg.type] ?? <Package size={13} strokeWidth={1.7} />}
              </span>
              <StatusBadge status={leg.status} />
              {leg.delay_hours && (
                <span className="delay-badge" style={{ marginLeft: "auto" }}>
                  +{leg.delay_hours}h
                </span>
              )}
            </div>
            <div className="leg-vendor">{leg.vendor_name}</div>
            <div className="leg-route">{leg.origin} → {leg.destination}</div>
            <div className="leg-eta">
              ETA:&nbsp;
              <span className={leg.status === "delayed" ? "text-red" : "text-sub"}>
                {new Date(leg.promised_eta).toLocaleDateString("en-GB", {
                  day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit",
                })}
              </span>
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
  const [expanded, setExpanded]         = useState(null);
  const [blameTarget, setBlameTarget]   = useState(null);
  const [activeFilter, setActiveFilter] = useState(null);

  const toggle = (id) => setExpanded(expanded === id ? null : id);

  const getWorstLeg = (s) =>
    s.legs.find((l) => l.status === "delayed") ||
    s.legs.find((l) => l.status === "at_risk");

  const counts = {
    on_track: state.shipments.filter((s) => s.status === "on_track" && !s.legs.some((l) => l.status === "at_risk")).length,
    at_risk:  state.shipments.filter((s) => s.legs.some((l) => l.status === "at_risk")).length,
    delayed:  state.shipments.filter((s) => s.status === "delayed").length,
  };

  const visibleShipments = activeFilter
    ? state.shipments.filter((s) => {
        const isDelayed = s.status === "delayed";
        const hasAtRisk = s.legs.some((l) => l.status === "at_risk");
        if (activeFilter === "delayed")  return isDelayed;
        if (activeFilter === "at_risk")  return hasAtRisk;
        if (activeFilter === "on_track") return !isDelayed && !hasAtRisk;
        return true;
      })
    : state.shipments;

  const filterDef = [
    { key: "on_track", label: "On Track", color: "green" },
    { key: "at_risk",  label: "At Risk",  color: "amber" },
    { key: "delayed",  label: "Delayed",  color: "red"   },
  ];

  return (
    <div>
      {/* ── Page header ── */}
      <div className="tracker-header">
        <div className="tracker-header-left">
          <h1 className="tracker-title">Shipment Tracker</h1>
          <p className="tracker-sub">
            {state.shipments.length} active shipments
            {activeFilter && (
              <span className="filter-active-label">
                &nbsp;· filtered:{" "}
                <strong>{filterDef.find((f) => f.key === activeFilter)?.label}</strong>
                <button
                  className="filter-clear-btn"
                  onClick={() => setActiveFilter(null)}
                >
                  ✕
                </button>
              </span>
            )}
          </p>
        </div>

        {/* Filter chips */}
        <div className="filter-chips">
          {filterDef.map(({ key, label, color }) => (
            <button
              key={key}
              className={`filter-chip filter-chip-${color} ${
                activeFilter === key ? "filter-chip-active" : ""
              }`}
              onClick={() => setActiveFilter(activeFilter === key ? null : key)}
              title={`Filter: ${label}`}
            >
              <span className="filter-chip-count">{counts[key]}</span>
              <span className="filter-chip-label">{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Shipment list ── */}
      <div className="shipment-list">
        {visibleShipments.length === 0 && (
          <div className="empty-state">No shipments match this filter.</div>
        )}

        {visibleShipments.map((s) => {
          const worstLeg   = getWorstLeg(s);
          const isOpen     = expanded === s.id;
          const isDelayed  = s.status === "delayed";
          const isAtRisk   = !isDelayed && s.legs.some((l) => l.status === "at_risk");
          const cardStatus = isDelayed ? "delayed" : isAtRisk ? "at_risk" : "on_track";

          return (
            <div
              key={s.id}
              className={`shipment-card ${
                isDelayed ? "shipment-delayed" : isAtRisk ? "shipment-atrisk" : ""
              }`}
            >
              {/* ── Card header ── */}
              <div className="shipment-header" onClick={() => toggle(s.id)}>

                {/* Col 1: Status + ID + Title */}
                <div className="sh-col sh-col-id">
                  <StatusDot status={cardStatus} />
                  <div className="sh-id-block">
                    <span className="sh-id">{s.id}</span>
                    <span className="sh-title">{s.title}</span>
                  </div>
                </div>

                {/* Col 2: Route */}
                <div className="sh-col sh-col-route">
                  <span className="sh-origin">{s.origin}</span>
                  <span className="sh-route-arrow">→</span>
                  <span className="sh-dest">{s.destination}</span>
                </div>

                {/* Col 3: Customer + Value */}
                <div className="sh-col sh-col-meta">
                  <span className="sh-customer">{s.customer}</span>
                  <span className="sh-value">${s.total_value.toLocaleString()}</span>
                </div>

                {/* Col 4: Actions */}
                <div className="sh-col sh-col-actions">
                  {worstLeg && isDelayed && (
                    <button
                      className="blame-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        setBlameTarget({ shipment: s, leg: worstLeg });
                      }}
                    >
                      <Zap size={11} strokeWidth={2.5} />
                      Analyze Blame
                    </button>
                  )}
                  <StatusBadge status={cardStatus} />
                  <span className="expand-icon">
                    {isOpen
                      ? <ChevronUp   size={14} strokeWidth={2} />
                      : <ChevronDown size={14} strokeWidth={2} />}
                  </span>
                </div>
              </div>

              {/* ── Delay alert bar ── */}
              {isDelayed && worstLeg && (
                <div className="delay-alert-bar">
                  <span
                    className="delay-reason-tag"
                    style={{
                      background: `var(--${REASON_COLOR[worstLeg.reason] ?? "red"}-dim)`,
                      color: `var(--${REASON_COLOR[worstLeg.reason] ?? "red"})`,
                    }}
                  >
                    <span className="delay-reason-icon">
                      {REASON_ICON[worstLeg.reason] ?? <AlertTriangle size={11} />}
                    </span>
                    {REASON_LABEL[worstLeg.reason] ?? worstLeg.reason}
                  </span>
                  <span className="delay-alert-msg">{worstLeg.delay_message}</span>
                </div>
              )}

              {/* ── Expanded legs ── */}
              {isOpen && (
                <div className="shipment-legs">
                  <div className="section-title" style={{ marginBottom: 12 }}>
                    Leg Breakdown
                  </div>
                  <LegTimeline legs={s.legs} />
                </div>
              )}
            </div>
          );
        })}
      </div>

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