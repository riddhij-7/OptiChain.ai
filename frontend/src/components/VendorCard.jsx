import ScoreChart from "./ScoreChart";
import IncidentLog from "./IncidentLog";

export default function VendorCard({ vendor }) {
  const isCritical = vendor.on_time_rate < 60;

  return (
    <div style={{ background: "var(--bg-card)", border: `1px solid ${isCritical ? "rgba(230,57,70,0.4)" : "var(--border)"}`, borderRadius: 12, padding: 16, position: "relative" }}>
      {isCritical && (
        <div style={{ position: "absolute", top: 12, right: 12, background: "var(--red)", color: "#fff", fontSize: 10, fontWeight: 700, padding: "3px 8px", borderRadius: 4, letterSpacing: "0.5px" }}>
          🚨 RED FLAG
        </div>
      )}

      <div style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 12 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 15, fontWeight: 600, color: "var(--text)", marginBottom: 2 }}>{vendor.name}</div>
          <div style={{ fontSize: 11, color: "var(--text-dim)" }}>{vendor.type}</div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 24, fontWeight: 700, color: isCritical ? "var(--red)" : vendor.on_time_rate < 75 ? "var(--amber)" : "var(--green)" }}>
            {vendor.on_time_rate}%
          </div>
          <div style={{ fontSize: 10, color: "var(--text-dim)", marginTop: -2 }}>on-time</div>
        </div>
      </div>

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

      <ScoreChart data={vendor.monthly_performance} currentRate={vendor.on_time_rate} />

      {vendor.risk_routes?.length > 0 && (
        <div style={{ marginTop: 12, padding: "8px 10px", background: "var(--amber-dim)", border: "1px solid rgba(244,162,97,0.3)", borderRadius: 6 }}>
          <div style={{ fontSize: 10, color: "var(--amber)", fontWeight: 600, marginBottom: 4 }}>⚠️ Worst Route</div>
          <div style={{ fontSize: 11, color: "var(--text)", fontWeight: 500 }}>{vendor.risk_routes[0].route}</div>
          <div style={{ fontSize: 10, color: "var(--text-sub)", marginTop: 2 }}>{vendor.risk_routes[0].on_time_rate}% on-time · {vendor.risk_routes[0].reason}</div>
        </div>
      )}

      <IncidentLog incidents={vendor.incidents} />
    </div>
  );
}
