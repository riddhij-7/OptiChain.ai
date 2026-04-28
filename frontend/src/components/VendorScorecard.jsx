import { useApp } from "../context/AppContext";
import VendorCard from "./VendorCard";

export default function VendorScorecard() {
  const { state } = useApp();
  const { vendors } = state;

  const avgOnTime = Math.round(vendors.reduce((s, v) => s + v.on_time_rate, 0) / vendors.length);
  const flagged = vendors.filter((v) => v.on_time_rate < 60).length;
  const totalIncidents = vendors.reduce((s, v) => s + v.incidents.length, 0);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 600, letterSpacing: "-0.3px" }}>Vendor Scorecards</h1>
          <p style={{ color: "var(--text-sub)", fontSize: 13, marginTop: 2 }}>
            {vendors.length} vendors · live blame tracking
          </p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <div style={{ background: "var(--green-dim)", border: "1px solid rgba(82,183,136,0.2)", borderRadius: 8, padding: "6px 14px", textAlign: "center" }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: "var(--green)" }}>{avgOnTime}%</div>
            <div style={{ fontSize: 10, color: "var(--text-dim)" }}>Avg On-Time</div>
          </div>
          <div style={{ background: flagged > 0 ? "var(--red-dim)" : "var(--bg-card)", border: `1px solid ${flagged > 0 ? "rgba(230,57,70,0.3)" : "var(--border)"}`, borderRadius: 8, padding: "6px 14px", textAlign: "center" }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: flagged > 0 ? "var(--red)" : "var(--text-dim)" }}>{flagged}</div>
            <div style={{ fontSize: 10, color: "var(--text-dim)" }}>Red Flags</div>
          </div>
          <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 8, padding: "6px 14px", textAlign: "center" }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: "var(--text)" }}>{totalIncidents}</div>
            <div style={{ fontSize: 10, color: "var(--text-dim)" }}>Total Incidents</div>
          </div>
        </div>
      </div>

      <div className="vendor-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
        {vendors.map((v) => (
          <VendorCard key={v.id} vendor={v} />
        ))}
      </div>
    </div>
  );
}
