import ScoreChart from "./ScoreChart";
import IncidentLog from "./IncidentLog";
import { AlertTriangle, TrendingUp, TrendingDown, ArrowRight, CheckCircle2 } from "lucide-react";

const TIER_STYLE = {
  RELIABLE:  { color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/30", label: "Reliable" },
  MONITOR:   { color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/30", label: "Monitor" },
  HIGH_RISK: { color: "text-rose-400", bg: "bg-rose-500/10", border: "border-rose-500/30", label: "High Risk" },
};

const ACTION_LABEL = {
  CONTINUE:        { color: "text-emerald-400", label: "✓ Continue" },
  REVIEW_CONTRACT: { color: "text-amber-400", label: "⚠ Review Contract" },
  ESCALATE:        { color: "text-rose-400", label: "⚠ Escalate" },
};

const TREND_ICON  = { 
  IMPROVING: <TrendingUp size={14} />, 
  DECLINING: <TrendingDown size={14} />, 
  STABLE: <ArrowRight size={14} /> 
};
const TREND_COLOR = { IMPROVING: "text-emerald-400", DECLINING: "text-rose-400", STABLE: "text-gray-400" };

export default function VendorCard({ vendor, insight }) {
  const isCritical = vendor.on_time_rate < 60;
  const tier = insight ? TIER_STYLE[insight.reliability_tier] : null;

  return (
    <div className={`bg-gray-900/60 backdrop-blur-sm rounded-2xl p-5 relative transition-all duration-300 border ${
      isCritical ? "border-rose-500/40 shadow-[0_0_20px_rgba(244,63,94,0.1)]" : 
      tier ? tier.border : "border-gray-800 hover:border-gray-700"
    }`}>
      
      {/* Red flag badge */}
      {isCritical && (
        <div className="absolute -top-3 -right-3 bg-rose-500 text-white text-[10px] font-bold px-2.5 py-1 rounded-md tracking-wider shadow-lg shadow-rose-500/30 flex items-center gap-1">
          <AlertTriangle size={10} strokeWidth={3} /> RED FLAG
        </div>
      )}

      {/* Vendor name + type */}
      <div className="flex items-start justify-between gap-3 mb-5 pr-4">
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-bold text-white mb-0.5 truncate">{vendor.name}</h3>
          <p className="text-xs text-gray-400 truncate">{vendor.type}</p>
        </div>
        <div className="text-right shrink-0">
          <div className={`text-3xl font-black ${isCritical ? "text-rose-400" : vendor.on_time_rate < 75 ? "text-amber-400" : "text-emerald-400"}`}>
            {vendor.on_time_rate}<span className="text-xl">%</span>
          </div>
          <div className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold mt-0.5">On-time</div>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        <div className="bg-gray-950/50 border border-gray-800/80 rounded-xl p-3 flex flex-col items-center justify-center">
          <div className="text-[10px] uppercase tracking-wider text-gray-500 font-medium mb-1">Total Shipments</div>
          <div className="text-lg font-bold text-white">{vendor.total_shipments}</div>
        </div>
        <div className={`bg-gray-950/50 border border-gray-800/80 rounded-xl p-3 flex flex-col items-center justify-center ${vendor.incidents.length > 3 ? "border-rose-500/20 bg-rose-500/5" : ""}`}>
          <div className="text-[10px] uppercase tracking-wider text-gray-500 font-medium mb-1">Incidents</div>
          <div className={`text-lg font-bold ${vendor.incidents.length > 3 ? "text-rose-400" : "text-white"}`}>
            {vendor.incidents.length}
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="h-32 mb-5">
         <ScoreChart data={vendor.monthly_performance} currentRate={vendor.on_time_rate} />
      </div>

      {/* Worst route */}
      {vendor.risk_routes?.length > 0 && (
        <div className="mb-5 p-3.5 bg-amber-500/5 border border-amber-500/20 rounded-xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-amber-500"></div>
          <div className="text-[10px] text-amber-500/80 font-bold uppercase tracking-wider mb-1 flex items-center gap-1.5">
            <AlertTriangle size={12} /> Worst Route
          </div>
          <div className="text-sm text-gray-200 font-medium mb-1">{vendor.risk_routes[0].route}</div>
          <div className="text-xs text-gray-400 flex justify-between">
             <span>{vendor.risk_routes[0].reason}</span>
             <span className="text-amber-400 font-semibold">{vendor.risk_routes[0].on_time_rate}%</span>
          </div>
        </div>
      )}

      {/* Incidents */}
      <IncidentLog incidents={vendor.incidents} />

      {/* AI Insight block */}
      {insight && tier && (
        <div className={`mt-5 ${tier.bg} border ${tier.border} rounded-xl p-4 shadow-inner`}>
          <div className="flex items-center justify-between mb-3">
            <span className={`text-[10px] font-bold ${tier.color} uppercase tracking-widest flex items-center gap-1.5`}>
              ✦ AI · {tier.label}
            </span>
            <span className={`flex items-center gap-1 text-xs font-bold ${TREND_COLOR[insight.trend]}`}>
              {TREND_ICON[insight.trend]} {insight.trend}
            </span>
          </div>

          <p className="text-xs text-gray-300 leading-relaxed mb-3">
            {insight.ai_verdict}
          </p>

          {insight.risk_factors?.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-2.5">
              {insight.risk_factors.map((f, i) => (
                <span key={i} className="text-[9px] bg-black/30 border border-white/5 text-gray-400 px-2 py-0.5 rounded-full font-medium tracking-wide">
                  {f}
                </span>
              ))}
            </div>
          )}

          {insight.strengths?.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-3">
              {insight.strengths.map((s, i) => (
                <span key={i} className="text-[9px] bg-emerald-500/10 border border-emerald-500/10 text-emerald-400/90 px-2 py-0.5 rounded-full font-medium tracking-wide flex items-center gap-1">
                  <CheckCircle2 size={10} /> {s}
                </span>
              ))}
            </div>
          )}

          {insight.action && ACTION_LABEL[insight.action] && (
            <div className={`text-xs font-bold pt-2 border-t border-black/10 ${ACTION_LABEL[insight.action].color}`}>
              {ACTION_LABEL[insight.action].label}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
