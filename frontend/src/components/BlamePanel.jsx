import "./BlamePanel.css";
import { useState, useEffect } from "react";
import { useApp } from "../context/AppContext";
import { runBlameTrace } from "../services/geminiService";
import {
  Zap, X, RotateCcw,
  XCircle, CheckCircle, AlertCircle,
  ClipboardList, Link, AlertTriangle, Lightbulb,
} from "lucide-react";

function TypeWriter({ text, speed = 18 }) {
  const [displayed, setDisplayed] = useState("");

  useEffect(() => {
    setDisplayed("");
    let i = 0;
    const interval = setInterval(() => {
      if (i < text.length) {
        setDisplayed(text.slice(0, i + 1));
        i++;
      } else {
        clearInterval(interval);
      }
    }, speed);
    return () => clearInterval(interval);
  }, [text, speed]);

  return <span>{displayed}<span className="cursor">▌</span></span>;
}

const VERDICT_STYLE = {
  "VENDOR FAULT":   { color: "var(--red)",   bg: "var(--red-dim)",   Icon: XCircle },
  "EXTERNAL CAUSE": { color: "var(--green)", bg: "var(--green-dim)", Icon: CheckCircle },
  "PARTIAL FAULT":  { color: "var(--amber)", bg: "var(--amber-dim)", Icon: AlertCircle },
};

export default function BlamePanel({ shipment, leg, onClose }) {
  const { state, dispatch } = useApp();
  const [status, setStatus] = useState("idle");
  const [result, setResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");

  const analyze = async () => {
    setStatus("loading");
    setResult(null);
    setErrorMsg("");

    try {
      const data = await runBlameTrace({
        shipment,
        leg,
        vendors: state.vendors,
      });

      setResult(data);
      setStatus("done");

      dispatch({
        type: "SET_BLAME",
        payload: {
          leg_id: leg.leg_id,
          shipment_id: shipment.id,
          vendor_id: leg.vendor_id,
          vendor_fault: data.vendor_fault,
          blame_score: data.blame_score,
          delay_hours: leg.delay_hours,
          reason: leg.reason,
          result: data,
        },
      });
    } catch (err) {
      setErrorMsg(err.message);
      setStatus("error");
    }
  };

  useEffect(() => {
    const cached = state.blameReports[leg.leg_id];
    if (cached?.result) {
      setResult(cached.result);
      setStatus("done");
    } else {
      analyze();
    }
  }, []);

  const verdictStyle = result
    ? (VERDICT_STYLE[result.verdict] || VERDICT_STYLE["PARTIAL FAULT"])
    : null;

  return (
    <div className="blame-overlay" onClick={onClose}>
      <div className="blame-panel" onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div className="blame-panel-header">
          <div>
            <div className="blame-panel-title">
              <Zap size={14} strokeWidth={2.5} className="blame-title-icon" />
              Blame Analysis
            </div>
            <div className="blame-panel-sub">
              {shipment.id} · {leg.leg_id} · {leg.vendor_name}
            </div>
          </div>
          <button className="close-btn" onClick={onClose}>
            <X size={13} strokeWidth={2} />
          </button>
        </div>

        {/* Context bar */}
        <div className="blame-context-bar">
          <div className="blame-context-item">
            <span className="blame-context-label">Route</span>
            <span>{shipment.origin} → {shipment.destination}</span>
          </div>
          <div className="blame-context-item">
            <span className="blame-context-label">Delay</span>
            <span className="text-red">+{leg.delay_hours}h</span>
          </div>
          <div className="blame-context-item">
            <span className="blame-context-label">Reason</span>
            <span>{leg.reason}</span>
          </div>
          <div className="blame-context-item">
            <span className="blame-context-label">Value at Risk</span>
            <span>${shipment.total_value.toLocaleString()}</span>
          </div>
        </div>

        {/* Body */}
        <div className="blame-panel-body">

          {/* Loading */}
          {status === "loading" && (
            <div className="blame-loading">
              <div className="blame-spinner" />
              <div className="blame-loading-text">
                Gemini is analyzing carrier history, SLA breach, and downstream impact...
              </div>
              <div className="blame-loading-steps">
                <div className="loading-step active">▸ Checking vendor SLA records</div>
                <div className="loading-step active">▸ Cross-referencing incident history</div>
                <div className="loading-step active">▸ Calculating downstream cascade</div>
                <div className="loading-step active">▸ Generating evidence packet</div>
              </div>
            </div>
          )}

          {/* Error — emoji kept intentionally */}
          {status === "error" && (
            <div className="blame-error">
              <div style={{ fontSize: 28, marginBottom: 8 }}>⚠️</div>
              <div style={{ color: "var(--red)", fontWeight: 500, marginBottom: 8 }}>Analysis failed</div>
              <div style={{ color: "var(--text-sub)", fontSize: 12, marginBottom: 16 }}>{errorMsg}</div>
              <button className="retry-btn" onClick={analyze}>
                <RotateCcw size={12} strokeWidth={2.2} />
                Retry
              </button>
            </div>
          )}

          {/* Result */}
          {status === "done" && result && (() => {
            const { color, bg, Icon } = verdictStyle;
            return (
              <div className="blame-result">

                {/* Verdict banner */}
                <div
                  className="verdict-banner"
                  style={{ background: bg, borderColor: color + "44" }}
                >
                  <span className="verdict-icon">
                    <Icon size={22} strokeWidth={1.8} style={{ color }} />
                  </span>
                  <div>
                    <div className="verdict-label" style={{ color }}>{result.verdict}</div>
                    <div className="verdict-root-cause">{result.root_cause}</div>
                  </div>
                  <div className="verdict-score" style={{ color }}>
                    <span className="score-num">{result.blame_score}</span>
                    <span className="score-label">/ 100</span>
                  </div>
                </div>

                {/* Evidence packet */}
                <div className="evidence-card">
                  <div className="evidence-card-title">
                    <ClipboardList size={11} strokeWidth={2} />
                    Evidence Packet
                  </div>
                  <div className="evidence-summary">
                    <TypeWriter text={result.summary} speed={16} />
                  </div>
                </div>

                {/* Evidence points */}
                <div className="evidence-points">
                  {result.evidence.map((point, i) => (
                    <div key={i} className="evidence-point">
                      <span className="evidence-num">{i + 1}</span>
                      <span>{point}</span>
                    </div>
                  ))}
                </div>

                {/* Downstream impact */}
                <div className="impact-box">
                  <div className="impact-title">
                    <Link size={11} strokeWidth={2} />
                    Downstream Cascade
                  </div>
                  <div className="impact-body">{result.downstream_impact}</div>
                </div>

                {/* Risk warning */}
                {result.risk_warning && (
                  <div className="risk-warning-box">
                    <div className="risk-warning-title">
                      <AlertTriangle size={11} strokeWidth={2} />
                      Pattern Detected
                    </div>
                    <div className="risk-warning-body">{result.risk_warning}</div>
                  </div>
                )}

                {/* Recommendation */}
                <div className="recommendation-box">
                  <div className="rec-title">
                    <Lightbulb size={11} strokeWidth={2} />
                    Recommendation
                  </div>
                  <div className="rec-body">{result.recommendation}</div>
                </div>

              </div>
            );
          })()}
        </div>

      </div>
    </div>
  );
}