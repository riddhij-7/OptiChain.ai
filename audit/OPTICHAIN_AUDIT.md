# OptiChain.ai Repository Audit

## Executive Summary

OptiChain.ai is currently a visually impressive **frontend-heavy prototype**. It effectively demonstrates real-time delay tracking, SSE-based event streaming, and AI-driven root-cause analysis (RCA), but it lacks the backend persistence, external data integration, and deterministic logic required for a production supply chain system. 

The most critical finding is that **core application state (shipments, vendors, events) is hardcoded in JSON files and managed entirely in-memory on the frontend**. The backend serves primarily to broadcast mock events via SSE and handle user authentication. External data integrations like GPS, weather, and traffic are not implemented. Furthermore, the Gemini API key is currently exposed on the frontend, posing a significant security risk.

## Traced Execution Paths

### A. User opens the shipment dashboard
1. User navigates to `/` (ShipmentTracker).
2. Data is loaded **statically** on the frontend from `frontend/src/data/Shipment.json` via `frontend/src/context/AppContext.jsx`. No backend fetch occurs for shipment data.

### B. A shipment delay appears
1. On the first client connection to the backend `/events` SSE endpoint, `server.js` triggers `startDemoScript()`.
2. `webhook-events.js` fires mocked events based on a timer.
3. Backend broadcasts the event over SSE (`broadcast()`).
4. Frontend `AppContext.jsx` receives the event and dispatches `DELAY_EVENT`, updating UI state. 

### C & D. User clicks "Analyze Blame" & Gemini Response
1. User clicks the "AI Analysis" button in `ShipmentTracker.jsx`.
2. Triggers `runBlameTrace()` in `frontend/src/services/geminiService.js`.
3. Constructs a prompt and makes a **direct fetch call from the browser** to `generativelanguage.googleapis.com`.
4. The frontend parses the LLM's JSON response and dispatches `SET_BLAME` to update vendor scores locally.

### E. A simulated webhook or timer generates an event
1. `server.js` contains a `POST /webhook` endpoint.
2. A POST request triggers `broadcast({ type: "delay", ... })` to connected SSE clients.
3. The event is not persisted to any database.

### F. An SSE client receives and displays an update
1. The frontend `EventSource` in `AppContext.jsx` receives the event.
2. It parses the JSON, dispatches the action, and the React context updates immediately.

### G. A shipment or vendor is created or updated
1. **Unverified/Broken:** Cannot be done persistently. State updates are stored in the React reducer and are lost on page reload.

## Security and Reliability Risks

**P0 (Critical)**
- **Exposed API Key:** `VITE_GEMINI_API_KEY` in `geminiService.js` means the key is shipped to the client browser.
- **No Data Persistence:** Shipment and vendor data are not fetched from or saved to a database.

**P1 (High)**
- **No Webhook Authentication:** `POST /webhook` is completely open.
- **Missing Authorization:** `POST /webhook` and `POST /reset` lack JWT validation.

**P2 (Medium)**
- **LLM Hallucination Risk:** RCA relies entirely on Gemini without deterministic verification of evidence.
