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

const REASON_ICON = {
  breakdown:    <Truck        size={14} strokeWidth={2} />,
  customs:      <FileX        size={14} strokeWidth={2} />,
  weather:      <CloudLightning size={14} strokeWidth={2} />,
  vendor_fault: <ShieldAlert  size={14} strokeWidth={2} />,
};

const TYPE_ICON = {
  sea:  <Ship  size={16} strokeWidth={1.7} />,
  air:  <Plane size={16} strokeWidth={1.7} />,
  road: <Truck size={16} strokeWidth={1.7} />,
};

function StatusDot({ status }) {
  const map = {
    completed: "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]",
    on_track:  "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]",
    delayed:   "bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]",
    at_risk:   "bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]",
    pending:   "bg-gray-500",
  };
  return <span className={`w-2.5 h-2.5 rounded-full inline-block ${map[status] || map.pending}`} />;
}

function StatusBadge({ status }) {
  const map = {
    completed: { label: "Completed", cls: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" },
    on_track:  { label: "On Track",  cls: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" },
    delayed:   { label: "Delayed",   cls: "bg-rose-500/10 text-rose-400 border border-rose-500/20" },
    at_risk:   { label: "At Risk",   cls: "bg-amber-500/10 text-amber-400 border border-amber-500/20" },
    pending:   { label: "Pending",   cls: "bg-gray-700/30 text-gray-400 border border-gray-700/50" },
  };
  const { label, cls } = map[status] || map.pending;
  return <span className={`px-2 py-0.5 rounded text-xs font-medium ${cls}`}>{label}</span>;
}

function LegTimeline({ legs }) {
  return (
    <div className="flex flex-col gap-0 ml-4 border-l border-gray-800">
      {legs.map((leg, i) => (
        <div key={leg.leg_id} className="relative pl-6 pb-6 last:pb-0">
          <div className="absolute left-[-5px] top-1">
            <StatusDot status={leg.status} />
          </div>
          <div className="bg-gray-900/40 rounded-xl p-4 border border-gray-800/50 hover:bg-gray-800/40 transition-colors">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <span className="text-gray-400 text-sm font-medium">Leg {leg.sequence}</span>
                <span className="text-gray-500">
                  {TYPE_ICON[leg.type] ?? <Package size={16} />}
                </span>
                <StatusBadge status={leg.status} />
              </div>
              {leg.delay_hours && (
                <span className="text-rose-400 font-semibold bg-rose-500/10 px-2 py-0.5 rounded text-sm">
                  +{leg.delay_hours}h
                </span>
              )}
            </div>
            <div className="text-white font-medium mb-1">{leg.vendor_name}</div>
            <div className="text-gray-400 text-sm mb-2">{leg.origin} → {leg.destination}</div>
            <div className="text-sm">
              <span className="text-gray-500">ETA: </span>
              <span className={leg.status === "delayed" ? "text-rose-400 font-medium" : "text-gray-300"}>
                {new Date(leg.promised_eta).toLocaleDateString("en-GB", {
                  day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit",
                })}
              </span>
            </div>
            {leg.delay_message && (
              <div className="mt-3 text-sm text-amber-400/90 bg-amber-500/10 p-2.5 rounded-lg border border-amber-500/20 flex items-start gap-2">
                 <AlertTriangle size={14} className="mt-0.5 shrink-0" />
                 <span>{leg.delay_message}</span>
              </div>
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
    { key: "on_track", label: "On Track", color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30", active: "bg-emerald-500/20 border-emerald-500/50 ring-1 ring-emerald-500/50" },
    { key: "at_risk",  label: "At Risk",  color: "text-amber-400 bg-amber-500/10 border-amber-500/30", active: "bg-amber-500/20 border-amber-500/50 ring-1 ring-amber-500/50" },
    { key: "delayed",  label: "Delayed",  color: "text-rose-400 bg-rose-500/10 border-rose-500/30", active: "bg-rose-500/20 border-rose-500/50 ring-1 ring-rose-500/50" },
  ];

  return (
    <div className="max-w-5xl mx-auto pb-12 text-white">
      {/* ── Page header ── */}
      <div className="flex justify-between items-end mb-8 border-b border-gray-800 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Shipment Tracker</h1>
          <p className="text-gray-400 text-sm mt-1">
            {state.shipments.length} active shipments
            {activeFilter && (
              <span className="ml-2 pl-2 border-l border-gray-700">
                filtered: <strong className="text-white">{filterDef.find((f) => f.key === activeFilter)?.label}</strong>
                <button
                  className="ml-2 hover:text-white text-gray-500"
                  onClick={() => setActiveFilter(null)}
                >
                  ✕
                </button>
              </span>
            )}
          </p>
        </div>

        {/* Filter chips */}
        <div className="flex gap-3">
          {filterDef.map(({ key, label, color, active }) => (
            <button
              key={key}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all ${
                activeFilter === key ? active : color
              } hover:opacity-80`}
              onClick={() => setActiveFilter(activeFilter === key ? null : key)}
            >
              <span className="font-bold">{counts[key]}</span>
              <span className="text-sm font-medium">{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Shipment list ── */}
      <div className="space-y-4">
        {visibleShipments.length === 0 && (
          <div className="text-center py-12 text-gray-500 bg-gray-900/30 rounded-xl border border-gray-800 border-dashed">
            No shipments match this filter.
          </div>
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
              className={`rounded-xl border transition-all duration-300 overflow-hidden ${
                isDelayed ? "bg-gray-900 border-rose-500/30 shadow-[0_4px_20px_-10px_rgba(244,63,94,0.3)]" : 
                isAtRisk ? "bg-gray-900 border-amber-500/30" : 
                "bg-gray-900/50 border-gray-800 hover:border-gray-700"
              }`}
            >
              {/* ── Card header ── */}
              <div 
                className="flex items-center p-5 cursor-pointer hover:bg-gray-800/30 transition-colors"
                onClick={() => toggle(s.id)}
              >
                {/* Col 1: Status + ID + Title */}
                <div className="flex items-center gap-4 w-2/5">
                  <StatusDot status={cardStatus} />
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-gray-300">{s.id}</span>
                    <span className="font-medium text-white truncate pr-4">{s.title}</span>
                  </div>
                </div>

                {/* Col 2: Route */}
                <div className="flex items-center gap-3 w-1/4 text-sm text-gray-400">
                  <span className="truncate">{s.origin}</span>
                  <span className="text-gray-600">→</span>
                  <span className="truncate">{s.destination}</span>
                </div>

                {/* Col 3: Customer + Value */}
                <div className="flex flex-col w-1/5">
                  <span className="text-sm text-gray-300 truncate">{s.customer}</span>
                  <span className="text-xs text-emerald-400/90 font-medium">${s.total_value.toLocaleString()}</span>
                </div>

                {/* Col 4: Actions */}
                <div className="flex items-center justify-end gap-4 w-[15%]">
                  {worstLeg && isDelayed && (
                    <button
                      className="flex items-center gap-1.5 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white text-xs font-semibold px-3 py-1.5 rounded shadow-lg shadow-purple-500/20 transition-all"
                      onClick={(e) => {
                        e.stopPropagation();
                        setBlameTarget({ shipment: s, leg: worstLeg });
                      }}
                    >
                      <Zap size={13} strokeWidth={2.5} />
                      AI Analysis
                    </button>
                  )}
                  {!isDelayed && <StatusBadge status={cardStatus} />}
                  <div className="text-gray-500 ml-2">
                    {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                  </div>
                </div>
              </div>

              {/* ── Delay alert bar ── */}
              {isDelayed && worstLeg && (
                <div className="px-5 py-3 bg-rose-500/5 border-t border-rose-500/10 flex items-center gap-4">
                  <span className="flex items-center gap-1.5 bg-rose-500/10 text-rose-400 text-xs font-semibold px-2.5 py-1 rounded-md border border-rose-500/20">
                    {REASON_ICON[worstLeg.reason] ?? <AlertTriangle size={12} />}
                    {REASON_LABEL[worstLeg.reason] ?? worstLeg.reason}
                  </span>
                  <span className="text-sm text-gray-300">{worstLeg.delay_message}</span>
                </div>
              )}

              {/* ── Expanded legs ── */}
              {isOpen && (
                <div className="p-6 bg-gray-950/50 border-t border-gray-800/80">
                  <div className="text-sm font-semibold text-gray-400 mb-6 uppercase tracking-wider">
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