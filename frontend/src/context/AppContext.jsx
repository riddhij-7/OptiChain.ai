import { createContext, useContext, useReducer, useEffect, useRef, useState } from "react";
import shipmentsData from "../data/Shipment.json";
import vendorsData from "../data/Vendors.json";

const AppContext = createContext();
const BACKEND = import.meta.env.VITE_BACKEND_URL ?? "";

function reducer(state, action) {
  switch (action.type) {

    case "DELAY_EVENT": {
      const { shipment_id, leg_id, delay_hours, reason, message, severity, downstream_legs_at_risk } = action.payload;
      return {
        ...state,
        shipments: state.shipments.map((s) =>
          s.id !== shipment_id ? s : {
            ...s,
            status: "delayed",
            legs: s.legs.map((l) => {
              if (l.leg_id === leg_id)
                return { ...l, status: "delayed", delay_hours, reason, delay_message: message, severity };
              if (downstream_legs_at_risk?.includes(l.leg_id))
                return { ...l, status: "at_risk" };
              return l;
            }),
          }
        ),
        events: [
          { id: Date.now(), shipment_id, leg_id, delay_hours, reason, message, severity, timestamp: new Date().toISOString() },
          ...state.events,
        ],
      };
    }

    case "SET_BLAME": {
      const { vendor_fault, vendor_id } = action.payload;
      return {
        ...state,
        blameReports: { ...state.blameReports, [action.payload.leg_id]: action.payload },
        vendors: state.vendors.map((v) => {
          if (v.id !== vendor_id) return v;
          const newRate = vendor_fault ? Math.max(0, v.on_time_rate - 4) : v.on_time_rate;
          const updatedMonthly = v.monthly_performance.map((m, i) =>
            i === v.monthly_performance.length - 1 ? { ...m, on_time_rate: newRate } : m
          );
          return {
            ...v,
            on_time_rate: newRate,
            blame_score: vendor_fault ? Math.min(100, v.blame_score + 12) : v.blame_score,
            monthly_performance: updatedMonthly,
            incidents: vendor_fault
              ? [{ id: `INC-LIVE-${Date.now()}`, date: new Date().toISOString().split("T")[0], shipment_id: action.payload.shipment_id, leg: action.payload.leg_id, delay_hours: action.payload.delay_hours, reason: action.payload.reason, vendor_fault: true, resolved: false }, ...v.incidents]
              : v.incidents,
          };
        }),
      };
    }

    case "RESET":
      return {
        shipments: JSON.parse(JSON.stringify(shipmentsData)),
        vendors:   JSON.parse(JSON.stringify(vendorsData)),
        events:    [],
        blameReports: {},
      };

    default:
      return state;
  }
}

const initialState = {
  shipments: shipmentsData,
  vendors: vendorsData,
  events: [],
  blameReports: {},
};

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const [sseStatus, setSseStatus] = useState("connecting"); // connecting | live | error
  const esRef = useRef(null);
  const retryRef = useRef(null);

  function connect() {
    // Close any existing connection first
    if (esRef.current) esRef.current.close();

    setSseStatus("connecting");
    const es = new EventSource(`${BACKEND}/events`);
    esRef.current = es;

    es.onmessage = (e) => {
      const msg = JSON.parse(e.data);
      if (msg.type === "connected") setSseStatus("live");
      if (msg.type === "delay")     dispatch({ type: "DELAY_EVENT", payload: msg.data });
      if (msg.type === "reset")     dispatch({ type: "RESET" });
    };

    es.onopen = () => setSseStatus("live");

    es.onerror = () => {
      setSseStatus("error");
      es.close();
      // Retry after 5s — handles Render cold start spin-up (~10-30s)
      retryRef.current = setTimeout(connect, 5000);
    };
  }

  useEffect(() => {
    connect();
    return () => {
      esRef.current?.close();
      clearTimeout(retryRef.current);
    };
  }, []);

  return (
    <AppContext.Provider value={{ state, dispatch, sseStatus, BACKEND }}>
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => useContext(AppContext);
