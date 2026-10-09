import { useApp } from "../context/AppContext";
import { Truck, FileX, CloudLightning, ShieldAlert, Package, Radio } from "lucide-react";

const REASON_ICON = {
  breakdown:    <Truck          size={14} strokeWidth={2} />,
  customs:      <FileX          size={14} strokeWidth={2} />,
  weather:      <CloudLightning size={14} strokeWidth={2} />,
  vendor_fault: <ShieldAlert    size={14} strokeWidth={2} />,
};

const SEV_COLOR = {
  critical: "text-rose-400 bg-rose-500/10 border-rose-500/20",
  high:     "text-rose-400 bg-rose-500/10 border-rose-500/20",
  medium:   "text-amber-400 bg-amber-500/10 border-amber-500/20",
  low:      "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
};

function timeAgo(iso) {
  const secs = Math.floor((Date.now() - new Date(iso)) / 1000);
  if (secs < 60)   return `${secs}s ago`;
  if (secs < 3600) return `${Math.floor(secs / 60)}m ago`;
  return `${Math.floor(secs / 3600)}h ago`;
}

export default function LiveFeed() {
  const { state, sseStatus, BACKEND } = useApp();

  const dotClass = sseStatus === "live" ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" : sseStatus === "error" ? "bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]" : "bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]";
  const statusLabel = sseStatus === "live" ? "Connected · Live"
    : sseStatus === "error" ? "Reconnecting..."
    : "Connecting...";

  const backendHost = BACKEND
    ? BACKEND.replace("https://", "").replace("http://", "")
    : "localhost:3001";

  return (
    <div className="w-80 border-l border-gray-800 bg-gray-900/40 flex flex-col h-full text-white">
      <div className="flex justify-between items-center px-5 py-4 border-b border-gray-800/80">
        <span className="font-semibold tracking-wide flex items-center gap-2">
          <Radio size={16} className="text-blue-400" />
          Live Webhook Feed
        </span>
        <span className={`w-2.5 h-2.5 rounded-full inline-block ${state.events.length > 0 ? "bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)] animate-pulse" : dotClass}`} />
      </div>

      {state.events.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-gray-500">
          <div className="bg-gray-800/50 p-4 rounded-full border border-gray-700/50 mb-4 animate-pulse">
            <Radio size={28} className="text-gray-400" />
          </div>
          <div className="text-sm font-medium mb-1 text-gray-400">Listening for carrier webhooks...</div>
          <div className="text-xs">Events will appear here in real time</div>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {state.events.map((ev) => (
            <div key={ev.id} className="bg-gray-900/80 border border-gray-800 rounded-lg p-4 shadow-lg hover:border-gray-700 transition-colors group">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-gray-400">
                  {REASON_ICON[ev.reason] ?? <Package size={14} />}
                </span>
                <span className="text-sm font-bold text-gray-200">{ev.shipment_id}</span>
                <span className="text-xs text-gray-500 font-mono bg-gray-800 px-1.5 py-0.5 rounded">
                  {ev.leg_id?.split("-").slice(-1)[0]}
                </span>
                <span className={`ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded border ${SEV_COLOR[ev.severity] ?? "text-rose-400 bg-rose-500/10 border-rose-500/20"}`}>
                  {ev.severity?.toUpperCase()}
                </span>
              </div>
              <div className="text-sm text-gray-300 mb-1.5 font-medium flex items-center gap-2">
                <span className="text-rose-400 bg-rose-500/10 px-1.5 py-0.5 rounded text-xs">+{ev.delay_hours}h</span>
                <span>{ev.reason.replace("_", " ")}</span>
              </div>
              <div className="text-xs text-gray-500 bg-gray-950 p-2 rounded border border-gray-800/50">
                {ev.message}
              </div>
              <div className="text-[10px] text-gray-600 mt-2 text-right font-medium">
                {timeAgo(ev.timestamp)}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="px-5 py-3 border-t border-gray-800 bg-gray-950 flex items-center gap-3">
        <span className={`w-2 h-2 rounded-full inline-block ${dotClass}`} />
        <div className="flex flex-col">
          <span className="text-xs font-medium text-gray-400">{statusLabel}</span>
          <span className="text-[10px] text-gray-600">{backendHost}</span>
        </div>
      </div>
    </div>
  );
}
