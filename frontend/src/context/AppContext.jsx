import { createContext, useContext, useReducer, useEffect } from "react";
import shipmentsData from "../data/Shipment.json";
import vendorsData from "../data/Vendors.json";

const AppContext = createContext();

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
      return {
        ...state,
        blameReports: { ...state.blameReports, [action.payload.leg_id]: action.payload },
        vendors: state.vendors.map((v) =>
          v.id !== action.payload.vendor_id ? v : {
            ...v,
            on_time_rate: action.payload.vendor_fault ? Math.max(0, v.on_time_rate - 4) : v.on_time_rate,
            blame_score: action.payload.vendor_fault ? Math.min(100, v.blame_score + 12) : v.blame_score,
            incidents: action.payload.vendor_fault
              ? [{ id: `INC-LIVE-${Date.now()}`, date: new Date().toISOString().split("T")[0], shipment_id: action.payload.shipment_id, leg: action.payload.leg_id, delay_hours: action.payload.delay_hours, reason: action.payload.reason, vendor_fault: true, resolved: false }, ...v.incidents]
              : v.incidents,
          }
        ),
      };
    }

    case "RESET":
      return { ...initialState };

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

  useEffect(() => {
    const es = new EventSource("http://localhost:3001/events");

    es.onmessage = (e) => {
      const msg = JSON.parse(e.data);
      if (msg.type === "delay") dispatch({ type: "DELAY_EVENT", payload: msg.data });
      if (msg.type === "reset") dispatch({ type: "RESET" });
    };

    es.onerror = () => console.warn("SSE connection lost — retrying...");
    return () => es.close();
  }, []);

  return <AppContext.Provider value={{ state, dispatch }}>{children}</AppContext.Provider>;
}

export const useApp = () => useContext(AppContext);