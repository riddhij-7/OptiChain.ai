import { useApp } from "../context/AppContext";

const REASON_ICON = {
  breakdown:    "🔧",
  customs:      "📋",
  weather:      "🌩️",
  vendor_fault: "⚠️",
};

const SEV_COLOR = {
  critical: "var(--red)",
  high:     "var(--red)",
  medium:   "var(--amber)",
  low:      "var(--green)",
};

function timeAgo(iso) {
  const secs = Math.floor((Date.now() - new Date(iso)) / 1000);
  if (secs < 60) return `${secs}s ago`;
  if (secs < 3600) return `${Math.floor(secs / 60)}m ago`;
  return `${Math.floor(secs / 3600)}h ago`;
}

export default function LiveFeed() {
  const { state } = useApp();

  return (
    <div className="livefeed">
      <div className="livefeed-header">
        <span className="livefeed-title">Live Webhook Feed</span>
        {state.events.length > 0 && (
          <span className="dot dot-red" style={{ marginLeft: "auto" }} />
        )}
        {state.events.length === 0 && (
          <span className="dot dot-green" style={{ marginLeft: "auto" }} />
        )}
      </div>

      {state.events.length === 0 ? (
        <div className="livefeed-empty">
          <div style={{ fontSize: 24, marginBottom: 8 }}>📡</div>
          <div style={{ color: "var(--text-sub)", fontSize: 12, textAlign: "center" }}>
            Listening for carrier webhooks...
          </div>
          <div style={{ color: "var(--text-dim)", fontSize: 11, marginTop: 4, textAlign: "center" }}>
            Events will appear here in real time
          </div>
        </div>
      ) : (
        <div className="livefeed-events">
          {state.events.map((ev) => (
            <div key={ev.id} className="feed-event">
              <div className="feed-event-top">
                <span className="feed-icon">{REASON_ICON[ev.reason] || "📦"}</span>
                <span className="feed-shipment">{ev.shipment_id}</span>
                <span className="feed-leg">{ev.leg_id?.split("-").slice(-1)[0]}</span>
                <span
                  className="feed-sev"
                  style={{ color: SEV_COLOR[ev.severity] || "var(--red)" }}
                >
                  {ev.severity?.toUpperCase()}
                </span>
                <span className="feed-time">{timeAgo(ev.timestamp)}</span>
              </div>
              <div className="feed-delay">
                +{ev.delay_hours}h · {ev.reason}
              </div>
              <div className="feed-msg">{ev.message}</div>
            </div>
          ))}
        </div>
      )}

      <div className="livefeed-footer">
        <span className="dot dot-green" />
        <span style={{ fontSize: 11, color: "var(--text-dim)" }}>
          Connected to localhost:3001
        </span>
      </div>
    </div>
  );
}