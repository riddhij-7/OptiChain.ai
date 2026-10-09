import { useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import { useApp } from "./context/AppContext";
import ShipmentTracker from "./components/ShipmentTracker";
import VendorScorecard from "./components/VendorScorecard";
import LiveFeed from "./components/LiveFeed";
import Login from "./pages/Login";
import { Link2, RotateCcw, LogOut, User } from "lucide-react";

const BACKEND = import.meta.env.VITE_BACKEND_URL || "http://localhost:3001";

const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center text-white bg-gray-950">Loading...</div>;
  return user ? children : <Navigate to="/login" />;
};

function DashboardLayout() {
  const [activeTab, setActiveTab] = useState("tracker");
  const { state, dispatch } = useApp();
  const { user, logout } = useAuth();

  const delayedCount = state.shipments.filter((s) => s.status === "delayed").length;
  const atRiskCount  = state.shipments.filter((s) =>
    s.legs.some((l) => l.status === "at_risk")
  ).length;

  const handleReset = async () => {
    await fetch(`${BACKEND}/reset`, { method: "POST" });
    dispatch({ type: "RESET" });
  };

  return (
    <div className="app">
      <header className="navbar flex justify-between items-center px-6 py-3 border-b border-gray-800 bg-gray-900/50">
        <div className="navbar-left flex items-center gap-2">
          <div className="logo flex flex-col">
            <div className="flex items-center gap-1.5 text-blue-400 font-bold">
              <Link2 size={17} strokeWidth={2.2} />
              <span className="text-white tracking-wide">OptiChain.ai</span>
            </div>
            <span className="text-xs text-gray-500">Optimized intelligent supply chain</span>
          </div>
        </div>

        <nav className="navbar-center flex gap-4">
          <button
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${activeTab === "tracker" ? "bg-blue-600 text-white" : "text-gray-400 hover:text-white"}`}
            onClick={() => setActiveTab("tracker")}
          >
            Shipment Tracker
            {delayedCount > 0 && <span className="ml-2 px-1.5 py-0.5 rounded-md bg-red-500/20 text-red-400 text-xs">{delayedCount}</span>}
          </button>
          <button
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${activeTab === "vendors" ? "bg-blue-600 text-white" : "text-gray-400 hover:text-white"}`}
            onClick={() => setActiveTab("vendors")}
          >
            Vendor Scorecards
          </button>
        </nav>

        <div className="navbar-right flex items-center gap-4">
          <div className="flex items-center gap-3 border-r border-gray-700 pr-4">
             <div className="flex flex-col text-right">
               <span className="text-sm font-medium text-white">{user?.name}</span>
               <span className="text-xs text-gray-400">{user?.role}</span>
             </div>
             <div className="w-8 h-8 rounded-full bg-blue-600/20 flex items-center justify-center text-blue-400 border border-blue-500/30">
               <User size={16} />
             </div>
          </div>
          
          <button onClick={logout} className="text-gray-400 hover:text-white flex items-center gap-2 text-sm transition-colors">
            <LogOut size={16} />
            Logout
          </button>
        </div>
      </header>

      <div className="main-layout flex h-[calc(100vh-60px)]">
        <div className="content-area flex-1 overflow-y-auto p-6">
          {activeTab === "tracker" && <ShipmentTracker />}
          {activeTab === "vendors" && <VendorScorecard />}
        </div>
        <LiveFeed />
      </div>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route 
        path="/*" 
        element={
          <PrivateRoute>
            <DashboardLayout />
          </PrivateRoute>
        } 
      />
    </Routes>
  );
}