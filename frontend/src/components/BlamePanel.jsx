export default function BlamePanel({ shipment, leg, onClose }) {
  return (
    <div className="blame-overlay" onClick={onClose}>
      <div className="blame-panel" onClick={(e) => e.stopPropagation()}>
        <div className="blame-panel-header">
          <div>
            <div style={{ fontSize: 16, fontWeight: 600 }}>Blame Analysis</div>
            <div style={{ fontSize: 12, color: "var(--text-sub)", marginTop: 2 }}>
              {shipment.id} · {leg.leg_id}
            </div>
          </div>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>
        <div style={{ padding: "24px", color: "var(--text-sub)", textAlign: "center" }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>⚡</div>
          <div>Gemini AI blame trace — coming next step</div>
        </div>
      </div>
    </div>
  );
}