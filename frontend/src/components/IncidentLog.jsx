export default function IncidentLog({ incidents }) {
  const recent = incidents.slice(0, 3);
  if (!recent.length) return <div style={{ fontSize: 11, color: "var(--text-dim)", marginTop: 8 }}>No incidents</div>;

  return (
    <div style={{ marginTop: 10 }}>
      <div style={{ fontSize: 10, color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: 6 }}>
        Recent Incidents
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {recent.map((inc) => (
          <div key={inc.id} style={{ background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 6, padding: "6px 8px", fontSize: 11 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
              <span style={{ fontFamily: "monospace", color: "var(--text-dim)", fontSize: 10 }}>{inc.id}</span>
              {inc.vendor_fault && <span style={{ background: "var(--red-dim)", color: "var(--red)", fontSize: 9, fontWeight: 600, padding: "1px 5px", borderRadius: 3 }}>FAULT</span>}
              <span style={{ marginLeft: "auto", color: "var(--red)", fontWeight: 600 }}>+{inc.delay_hours}h</span>
            </div>
            <div style={{ color: "var(--text-sub)", fontSize: 10 }}>{inc.leg}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
