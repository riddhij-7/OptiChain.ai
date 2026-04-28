import { useState } from "react";
import { useApp } from "../context/AppContext";
import VendorCard from "./VendorCard";
import { runVendorAnalysis } from "../services/geminiService";

const TIER_STYLE = {
  RELIABLE:  { color: "var(--green)", bg: "var(--green-dim)", border: "rgba(82,183,136,0.3)",  icon: "✅" },
  MONITOR:   { color: "var(--amber)", bg: "var(--amber-dim)", border: "rgba(244,162,97,0.3)",  icon: "⚠️" },
  HIGH_RISK: { color: "var(--red)",   bg: "var(--red-dim)",   border: "rgba(230,57,70,0.3)",   icon: "🚨" },
};

const ACTION_STYLE = {
  CONTINUE:          { color: "var(--green)", label: "Continue" },
  REVIEW_CONTRACT:   { color: "var(--amber)", label: "Review Contract" },
  ESCALATE:          { color: "var(--red)",   label: "Escalate" },
};

const TREND_ICON = { IMPROVING: "↗", DECLINING: "↘", STABLE: "→" };
const TREND_COLOR = { IMPROVING: "var(--green)", DECLINING: "var(--red)", STABLE: "var(--text-sub)" };

export default function VendorScorecard() {
  const { state } = useApp();
  const { vendors } = state;

  const [aiStatus, setAiStatus]   = useState("idle"); // idle | loading | done | error
  const [aiResult, setAiResult]   = useState(null);
  const [aiError, setAiError]     = useState("");

  const avgOnTime      = Math.round(vendors.reduce((s, v) => s + v.on_time_rate, 0) / vendors.length);
  const flagged        = vendors.filter((v) => v.on_time_rate < 60).length;
  const totalIncidents = vendors.reduce((s, v) => s + v.incidents.length, 0);

  const runAnalysis = async () => {
    setAiStatus("loading");
    setAiResult(null);
    setAiError("");
    try {
      const result = await runVendorAnalysis(vendors);
      setAiResult(result);
      setAiStatus("done");
    } catch (err) {
      setAiError(err.message);
      setAiStatus("error");
    }
  };

  const getVendorInsight = (vendorId) =>
    aiResult?.vendors?.find((v) => v.id === vendorId);

  return (
    <div>
      {/* ── Header ── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 600, letterSpacing: "-0.3px" }}>Vendor Scorecards</h1>
          <p style={{ color: "var(--text-sub)", fontSize: 13, marginTop: 2 }}>
            {vendors.length} vendors · live blame tracking
          </p>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
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
          <button
            onClick={runAnalysis}
            disabled={aiStatus === "loading"}
            style={{
              background: aiStatus === "loading" ? "var(--bg-hover)" : "var(--blue-dim)",
              border: `1px solid ${aiStatus === "loading" ? "var(--border)" : "rgba(72,149,239,0.35)"}`,
              color: aiStatus === "loading" ? "var(--text-dim)" : "var(--blue)",
              fontSize: 12, fontWeight: 600, fontFamily: "var(--font)",
              padding: "8px 14px", borderRadius: 8, cursor: aiStatus === "loading" ? "not-allowed" : "pointer",
              display: "flex", alignItems: "center", gap: 6, whiteSpace: "nowrap",
              transition: "all .15s",
            }}
          >
            {aiStatus === "loading" ? (
              <>
                <span style={{ width: 12, height: 12, border: "2px solid var(--border-lt)", borderTopColor: "var(--blue)", borderRadius: "50%", display: "inline-block", animation: "spin .7s linear infinite" }} />
                Analyzing...
              </>
            ) : (
              <>{aiStatus === "done" ? "✦ Re-analyze" : "✦ AI Reliability Check"}</>
            )}
          </button>
        </div>
      </div>

      {/* ── AI Fleet Health Banner ── */}
      {aiStatus === "done" && aiResult && (
        <div style={{ background: "var(--blue-dim)", border: "1px solid rgba(72,149,239,0.25)", borderRadius: 10, padding: "12px 16px", marginBottom: 16, display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 18 }}>🤖</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, color: "var(--blue)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 3 }}>AI Fleet Assessment</div>
            <div style={{ fontSize: 13, color: "var(--text)" }}>{aiResult.fleet_health}</div>
          </div>
          <div style={{ display: "flex", gap: 10, flexShrink: 0 }}>
            {aiResult.most_reliable && (
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 10, color: "var(--text-dim)", marginBottom: 2 }}>Most Reliable</div>
                <div style={{ fontSize: 11, fontWeight: 600, color: "var(--green)" }}>
                  {vendors.find((v) => v.id === aiResult.most_reliable)?.name ?? aiResult.most_reliable}
                </div>
              </div>
            )}
            {aiResult.highest_risk && (
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 10, color: "var(--text-dim)", marginBottom: 2 }}>Highest Risk</div>
                <div style={{ fontSize: 11, fontWeight: 600, color: "var(--red)" }}>
                  {vendors.find((v) => v.id === aiResult.highest_risk)?.name ?? aiResult.highest_risk}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {aiStatus === "error" && (
        <div style={{ background: "var(--red-dim)", border: "1px solid rgba(230,57,70,0.3)", borderRadius: 8, padding: "10px 14px", marginBottom: 16, fontSize: 12, color: "var(--red)", display: "flex", alignItems: "center", gap: 8 }}>
          ⚠️ AI analysis failed: {aiError}
          <button onClick={runAnalysis} style={{ marginLeft: "auto", background: "none", border: "1px solid rgba(230,57,70,0.4)", color: "var(--red)", fontSize: 11, padding: "3px 10px", borderRadius: 5, cursor: "pointer" }}>Retry</button>
        </div>
      )}

      {/* ── Vendor Cards Grid ── */}
      <div className="vendor-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
        {vendors.map((v) => {
          const insight = getVendorInsight(v.id);
          return <VendorCard key={v.id} vendor={v} insight={insight} />;
        })}
      </div>
    </div>
  );
}
