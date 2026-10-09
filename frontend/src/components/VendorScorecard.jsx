import { useState } from "react";
import { useApp } from "../context/AppContext";
import VendorCard from "./VendorCard";
import { runVendorAnalysis } from "../services/geminiService";
import { ShieldCheck, AlertTriangle, FileText, Loader2, RefreshCw } from "lucide-react";

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
    <div className="max-w-6xl mx-auto pb-12 text-white">
      {/* ── Header ── */}
      <div className="flex justify-between items-start mb-8 border-b border-gray-800 pb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Vendor Scorecards</h1>
          <p className="text-gray-400 text-sm mt-1">
            {vendors.length} vendors · live blame tracking
          </p>
        </div>
        <div className="flex gap-3 items-center">
          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-2 text-center">
            <div className="text-xl font-bold text-emerald-400">{avgOnTime}%</div>
            <div className="text-[10px] uppercase tracking-wider text-emerald-500/80 font-semibold mt-0.5">Avg On-Time</div>
          </div>
          <div className={`${flagged > 0 ? "bg-rose-500/10 border-rose-500/30" : "bg-gray-900 border-gray-800"} border rounded-xl px-4 py-2 text-center transition-colors`}>
            <div className={`text-xl font-bold ${flagged > 0 ? "text-rose-400" : "text-gray-400"}`}>{flagged}</div>
            <div className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold mt-0.5">Red Flags</div>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-xl px-4 py-2 text-center">
            <div className="text-xl font-bold text-gray-200">{totalIncidents}</div>
            <div className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold mt-0.5">Total Incidents</div>
          </div>
          <button
            onClick={runAnalysis}
            disabled={aiStatus === "loading"}
            className={`flex items-center gap-2 px-5 py-3 ml-2 rounded-xl text-sm font-bold transition-all shadow-lg ${
              aiStatus === "loading"
                ? "bg-gray-800 text-gray-400 cursor-not-allowed border border-gray-700"
                : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-blue-500/20"
            }`}
          >
            {aiStatus === "loading" ? (
              <><Loader2 size={16} className="animate-spin" /> Analyzing...</>
            ) : (
              <><ShieldCheck size={16} /> {aiStatus === "done" ? "Re-analyze" : "AI Reliability Check"}</>
            )}
          </button>
        </div>
      </div>

      {/* ── AI Fleet Health Banner ── */}
      {aiStatus === "done" && aiResult && (
        <div className="bg-gradient-to-r from-blue-900/30 to-indigo-900/20 border border-blue-500/20 rounded-2xl p-5 mb-8 flex items-center gap-6 shadow-xl shadow-blue-900/5">
          <div className="flex-1">
            <div className="text-xs font-bold text-blue-400 uppercase tracking-widest mb-1.5 flex items-center gap-2">
              <ShieldCheck size={14} /> AI Fleet Assessment
            </div>
            <div className="text-sm text-gray-200 leading-relaxed font-medium">{aiResult.fleet_health}</div>
          </div>
          <div className="flex gap-4 border-l border-blue-500/20 pl-6 shrink-0">
            {aiResult.most_reliable && (
              <div className="text-center bg-gray-950/50 rounded-lg px-4 py-2 border border-gray-800/50">
                <div className="text-[10px] uppercase tracking-wider text-gray-500 mb-1 font-semibold">Most Reliable</div>
                <div className="text-sm font-bold text-emerald-400">
                  {vendors.find((v) => v.id === aiResult.most_reliable)?.name ?? aiResult.most_reliable}
                </div>
              </div>
            )}
            {aiResult.highest_risk && (
              <div className="text-center bg-gray-950/50 rounded-lg px-4 py-2 border border-gray-800/50">
                <div className="text-[10px] uppercase tracking-wider text-gray-500 mb-1 font-semibold">Highest Risk</div>
                <div className="text-sm font-bold text-rose-400">
                  {vendors.find((v) => v.id === aiResult.highest_risk)?.name ?? aiResult.highest_risk}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {aiStatus === "error" && (
        <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-4 mb-8 text-sm text-rose-400 flex items-center gap-3">
          <AlertTriangle size={18} />
          <span className="font-medium">AI analysis failed: {aiError}</span>
          <button onClick={runAnalysis} className="ml-auto bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-300 text-xs font-bold py-1.5 px-3 rounded-lg transition-colors flex items-center gap-1.5">
            <RefreshCw size={12} /> Retry
          </button>
        </div>
      )}

      {/* ── Vendor Cards Grid ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {vendors.map((v) => {
          const insight = getVendorInsight(v.id);
          return <VendorCard key={v.id} vendor={v} insight={insight} />;
        })}
      </div>
    </div>
  );
}
