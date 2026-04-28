import { useApp } from "../context/AppContext";

export default function VendorScorecard() {
  const { state } = useApp();
  return (
    <div>
      <h1 style={{ fontSize: 20, fontWeight: 600, marginBottom: 20 }}>Vendor Scorecards</h1>
      <div style={{ color: "var(--text-sub)" }}>Coming in next step — {state.vendors.length} vendors loaded.</div>
    </div>
  );
}