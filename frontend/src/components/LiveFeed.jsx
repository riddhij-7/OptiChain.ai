import { useApp } from "../context/AppContext";
import { Truck, FileX, CloudLightning, ShieldAlert, Package, Radio } from "lucide-react";

const REASON_ICON = {
  breakdown:    <Truck          size={12} strokeWidth={2} />,
  customs:      <FileX          size={12} strokeWidth={2} />,
  weather:      <CloudLightning size={12} strokeWidth={2} />,
  vendor_fault: <ShieldAlert    size={12} strokeWidth={2} />,
};

const SEV_COLOR = {
  critical: "var(--red)",
  high:     "var(--red)",
  medium:   "var(--amber)",
  low:      "var(--green)",
};

function timeAgo(iso) {
  const secs = Math.floor((Date.now() - new Date(iso)) / 1000);
  if (secs < 60)   return `${secs}s ago`;
  if (secs < 3600) return `${Math.floor(secs / 60)}m ago`;
  return `${Math.floor(secs / 3600)}h ago`;
}

export default function LiveFeed() {
  const { state } = useApp();

  return (
    <div className="livefeed">
      <div className="livefeed-header">
        <span className="livefeed-title">Live Webhook Feed</span>
        <span
          className={`dot ${state.events.length > 0 ? "dot-red" : "dot-green"}`}
          style={{ marginLeft: "auto" }}
        />
      </div>

      {state.events.length === 0 ? (
        <div className="livefeed-empty">
          <Radio size={22} strokeWidth={1.5} style={{ color: "var(--text-dim)", marginBottom: 10 }} />
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
                <span className="feed-icon">
                  {REASON_ICON[ev.reason] ?? <Package size={12} strokeWidth={2} />}
                </span>
                <span className="feed-shipment">{ev.shipment_id}</span>
                <span className="feed-leg">{ev.leg_id?.split("-").slice(-1)[0]}</span>
                <span
                  className="feed-sev"
                  style={{ color: SEV_COLOR[ev.severity] ?? "var(--red)" }}
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