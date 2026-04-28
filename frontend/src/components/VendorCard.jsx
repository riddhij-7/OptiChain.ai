import ScoreChart from "./ScoreChart";
import IncidentLog from "./IncidentLog";

const TIER_STYLE = {
  RELIABLE:  { color: "var(--green)", bg: "var(--green-dim)", border: "rgba(82,183,136,0.3)",  label: "Reliable" },
  MONITOR:   { color: "var(--amber)", bg: "var(--amber-dim)", border: "rgba(244,162,97,0.3)",  label: "Monitor" },
  HIGH_RISK: { color: "var(--red)",   bg: "var(--red-dim)",   border: "rgba(230,57,70,0.3)",   label: "High Risk" },
};

const ACTION_LABEL = {
  CONTINUE:        { color: "var(--green)", label: "✓ Continue" },
  REVIEW_CONTRACT: { color: "var(--amber)", label: "⚠ Review Contract" },
  ESCALATE:        { color: "var(--red)",   label: " Escalate" },
};

const TREND_ICON  = { IMPROVING: "↗", DECLINING: "↘", STABLE: "→" };
const TREND_COLOR = { IMPROVING: "var(--green)", DECLINING: "var(--red)", STABLE: "var(--text-sub)" };

export default function VendorCard({ vendor, insight }) {
  const isCritical = vendor.on_time_rate < 60;
  const tier = insight ? TIER_STYLE[insight.reliability_tier] : null;

  return (
    <div style={{
      background: "var(--bg-card)",
      border: `1px solid ${isCritical ? "rgba(230,57,70,0.4)" : tier ? tier.border : "var(--border)"}`,
      borderRadius: 12, padding: 16, position: "relative",
      transition: "border-color .3s",
    }}>
      {/* Red flag badge */}
      {isCritical && (
        <div style={{ position: "absolute", top: 12, right: 12, background: "var(--red)", color: "#fff", fontSize: 10, fontWeight: 700, padding: "3px 8px", borderRadius: 4, letterSpacing: "0.5px" }}>
           RED FLAG
        </div>
      )}

      {/* Vendor name + type */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 12, paddingRight: isCritical ? 80 : 0 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 15, fontWeight: 600, color: "var(--text)", marginBottom: 2 }}>{vendor.name}</div>
          <div style={{ fontSize: 11, color: "var(--text-dim)" }}>{vendor.type}</div>
        </div>
        <div style={{ textAlign: "right", flexShrink: 0 }}>
          <div style={{ fontSize: 24, fontWeight: 700, color: isCritical ? "var(--red)" : vendor.on_time_rate < 75 ? "var(--amber)" : "var(--green)" }}>
            {vendor.on_time_rate}%
          </div>
          <div style={{ fontSize: 10, color: "var(--text-dim)", marginTop: -2 }}>on-time</div>
        </div>
      </div>

      {/* Stats row */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 12 }}>
        <div style={{ background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 6, padding: "6px 10px" }}>
          <div style={{ fontSize: 10, color: "var(--text-dim)" }}>Total Shipments</div>
          <div style={{ fontSize: 16, fontWeight: 600, color: "var(--text)", marginTop: 2 }}>{vendor.total_shipments}</div>
        </div>
        <div style={{ background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 6, padding: "6px 10px" }}>
          <div style={{ fontSize: 10, color: "var(--text-dim)" }}>Incidents</div>
          <div style={{ fontSize: 16, fontWeight: 600, color: vendor.incidents.length > 3 ? "var(--red)" : "var(--text)", marginTop: 2 }}>
            {vendor.incidents.length}
          </div>
        </div>
      </div>

      {/* Chart */}
      <ScoreChart data={vendor.monthly_performance} currentRate={vendor.on_time_rate} />

      {/* Worst route */}
      {vendor.risk_routes?.length > 0 && (
        <div style={{ marginTop: 12, padding: "8px 10px", background: "var(--amber-dim)", border: "1px solid rgba(244,162,97,0.3)", borderRadius: 6 }}>
          <div style={{ fontSize: 10, color: "var(--amber)", fontWeight: 600, marginBottom: 4 }}>⚠️ Worst Route</div>
          <div style={{ fontSize: 11, color: "var(--text)", fontWeight: 500 }}>{vendor.risk_routes[0].route}</div>
          <div style={{ fontSize: 10, color: "var(--text-sub)", marginTop: 2 }}>{vendor.risk_routes[0].on_time_rate}% on-time · {vendor.risk_routes[0].reason}</div>
        </div>
      )}

      {/* Incidents */}
      <IncidentLog incidents={vendor.incidents} />

      {/* AI Insight block */}
      {insight && tier && (
        <div style={{ marginTop: 12, background: tier.bg, border: `1px solid ${tier.border}`, borderRadius: 8, padding: "10px 12px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: tier.color, textTransform: "uppercase", letterSpacing: "0.5px" }}>
              ✦ AI · {tier.label}
            </span>
            <span style={{ marginLeft: "auto", fontSize: 13, fontWeight: 700, color: TREND_COLOR[insight.trend] }}>
              {TREND_ICON[insight.trend]} {insight.trend}
            </span>
          </div>

          <div style={{ fontSize: 12, color: "var(--text)", lineHeight: 1.5, marginBottom: 8 }}>
            {insight.ai_verdict}
          </div>

          {insight.risk_factors?.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 6 }}>
              {insight.risk_factors.map((f, i) => (
                <span key={i} style={{ fontSize: 10, background: "rgba(0,0,0,0.2)", color: "var(--text-sub)", padding: "2px 7px", borderRadius: 4 }}>
                  {f}
                </span>
              ))}
            </div>
          )}

          {insight.strengths?.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 6 }}>
              {insight.strengths.map((s, i) => (
                <span key={i} style={{ fontSize: 10, background: "rgba(82,183,136,0.1)", color: "var(--green)", padding: "2px 7px", borderRadius: 4 }}>
                  ✓ {s}
                </span>
              ))}
            </div>
          )}

          {insight.action && ACTION_LABEL[insight.action] && (
            <div style={{ fontSize: 11, fontWeight: 600, color: ACTION_LABEL[insight.action].color, marginTop: 4 }}>
              {ACTION_LABEL[insight.action].label}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
