import { useState } from "react";
import { useApp } from "./context/AppContext";
import ShipmentTracker from "./components/ShipmentTracker";
import VendorScorecard from "./components/VendorScorecard";
import LiveFeed from "./components/LiveFeed";
import { Link2, RotateCcw } from "lucide-react";
import "./App.css";

export default function App() {
  const [activeTab, setActiveTab] = useState("tracker");
  const { state, dispatch } = useApp();

  const delayedCount = state.shipments.filter((s) => s.status === "delayed").length;
  const atRiskCount  = state.shipments.filter((s) =>
    s.legs.some((l) => l.status === "at_risk")
  ).length;

  const handleReset = async () => {
    await fetch("http://localhost:3001/reset", { method: "POST" });
    dispatch({ type: "RESET" });
  };

  return (
    <div className="app">
      <header className="navbar">
        <div className="navbar-left">
          <div className="logo">
            <Link2 size={17} strokeWidth={2.2} className="logo-icon" />
            <span className="logo-text">OptiChain.ai</span><br /> 
            <span className="title-sub">Optimized intelligent supply chain</span>
          </div>
        </div>

        <nav className="navbar-center">
          <button
            className={`nav-btn ${activeTab === "tracker" ? "active" : ""}`}
            onClick={() => setActiveTab("tracker")}
          >
            Shipment Tracker
            {delayedCount > 0 && <span className="nav-badge">{delayedCount}</span>}
          </button>
          <button
            className={`nav-btn ${activeTab === "vendors" ? "active" : ""}`}
            onClick={() => setActiveTab("vendors")}
          >
            Vendor Scorecards
          </button>
        </nav>

        <div className="navbar-right">
          <div className="status-pills">
            {delayedCount > 0 && (
              <span className="pill pill-red">● {delayedCount} Delayed</span>
            )}
            {atRiskCount > 0 && (
              <span className="pill pill-amber">● {atRiskCount} At Risk</span>
            )}
            {delayedCount === 0 && atRiskCount === 0 && (
              <span className="pill pill-green">● All On Track</span>
            )}
          </div>
          <button className="reset-btn" onClick={handleReset}>
            <RotateCcw size={12} strokeWidth={2.2} />
            Reset Demo
          </button>
        </div>
      </header>

      <div className="main-layout">
        <div className="content-area">
          {activeTab === "tracker" && <ShipmentTracker />}
          {activeTab === "vendors" && <VendorScorecard />}
        </div>
        <LiveFeed />
      </div>
    </div>
  );
}