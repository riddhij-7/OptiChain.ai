# OptiChain.ai

**Optimized intelligent supply chain**

OptiChain.ai is a real-time supply chain disruption detection and accountability system. When a shipment delay occurs, it automatically traces the root cause, assigns blame to the responsible vendor, and updates carrier scorecards, before the problem cascades downstream.
Problem Statement & theme: Smart Supply Chains.

---

## The Problem

Modern supply chains fail silently. A vessel breaks down in the Arabian Sea at 3 AM. By the time a logistics manager notices, three downstream deliveries have already missed their windows. Nobody knows whose fault it was. The warehouse points at the carrier, the carrier points at the port, and the customer just sees a late shipment.

The root issues are:

- Delays are detected reactively, after damage is done
- Blame is assigned manually, if at all
- Vendor accountability has no memory, the same carrier fails repeatedly with no consequences
- Communication between distressed legs is fragmented across emails, calls, and spreadsheets

---

## How OptiChain.ai Solves It

OptiChain.ai introduces a **blame-first architecture** instead of just tracking shipments, it actively monitors SLA promises and fires accountability analysis the moment a breach is detected.

The prototype works in three layers:

**1. Webhook-driven delay detection**
Carriers push delay events to a central webhook endpoint (simulating real-world integrations with FedEx, Maersk, DHL APIs). Each event carries the shipment ID, leg ID, vendor, delay hours, and reason code. The frontend receives these instantly via Server-Sent Events (SSE), with no polling.

**2. AI blame trace**
When a delay hits, Gemini AI analyzes the full context, the specific leg that failed, the vendor's historical record, the reason code, and downstream legs at risk. It returns a structured verdict: Vendor Fault, External Cause, or Partial Fault, with a blame score (0–100), evidence points, and a plain-English evidence packet for the operations team.

**3. Vendor scorecards**
Every blame assignment updates the responsible vendor's scorecard in real time. On-time rates drop, blame scores climb, and fault incidents are logged. Before a new shipment is assigned to a flagged carrier, the system surfaces a risk warning automatically.

---

## Mental Model

```
Carrier API  ──webhook──►  Express Server  ──SSE──►  React Frontend
                                                           │
                                              AppContext (useReducer)
                                                           │
                                    ┌──────────────────────┼──────────────────────┐
                                    │                       │                      │
                             Shipment Tracker        Blame Panel            Vendor Scorecards
                             (live leg status)    (Gemini analysis)       (live score updates)
```

When a webhook fires:
1. Express receives the delay event and broadcasts it to all connected clients via SSE
2. React dispatches `DELAY_EVENT` : the matching shipment leg flips from green to red in state
3. Downstream legs flip to amber (at risk)
4. The live feed sidebar shows the incoming event with severity, reason, and message
5. User clicks "Analyze Blame", BlamePanel checks the cache first
6. If cached, result loads instantly. If not, Gemini is called once and the result is stored
7. Vendor scorecard updates automatically based on the blame verdict

---

## Features

**Real-time webhook pipeline**
- Express server with POST `/webhook` endpoint for carrier events
- SSE stream at `/events` — frontend receives updates with zero latency
- 4 scripted demo events fire automatically (t=5s, 15s, 30s, 50s) simulating real carrier webhooks
- Manual `/webhook` endpoint for live judge Q&A injection
- `/reset` endpoint to restore demo state

**Shipment tracker**
- 5 active shipments across real-world routes (Mumbai–Berlin, Chennai–Amsterdam, Pune–Stuttgart, Surat–Paris, Delhi–Tokyo)
- Each shipment has 4 legs with vendor, transport type, promised ETA, and live status
- Legs flip color in real time as webhooks arrive, green (on track), amber (at risk), red (delayed)
- Expandable leg timeline showing the full breakdown per shipment
- Delay alert bar with reason classification and carrier message

**AI blame trace (Gemini)**
- Powered by `gemini-2.0-flash-preview`
- Analyzes: delayed leg details, vendor SLA history, reason code, downstream cascade
- Returns structured JSON verdict with blame score, evidence points, downstream impact, and recommendations
- Result caches in React state after first call — subsequent opens are instant, no repeat API calls
- Graceful fallback if Gemini is unavailable, logic-based analysis using vendor history and reason codes

**Vendor scorecards**
- 3 vendor profiles with 6-month on-time performance charts (Recharts)
- Live score updates when blame is assigned — on-time rate drops, blame score climbs
- Fault vs non-fault incident separation
- Worst route flagging with seasonal risk notes
- AI Reliability Check — Gemini produces a comparative fleet health assessment

**Live webhook feed**
- Sidebar showing all incoming events in real time with animation
- Severity badges (critical, high, medium), reason icons, time-ago timestamps
- Connection status indicator

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, plain CSS |
| State management | React Context + useReducer |
| Real-time transport | Server-Sent Events (SSE) |
| Backend | Node.js, Express |
| AI | Google Gemini (`gemini-2.0-flash-preview`) |
| Charts | Recharts |
| Data | Hardcoded JSON (shipments, vendors) |
| Deployment | Firebase Hosting |

---

## Running Locally

**Backend**
```bash
cd backend
npm install
node server.js
```
Server starts on `http://localhost:3001`. Scripted demo events begin firing after 5 seconds.

**Frontend**
```bash
cd frontend
npm install
npm run dev
```
App starts on `http://localhost:5173`.

**Environment**

Create `frontend/.env`:
```
VITE_GEMINI_API_KEY=your_gemini_api_key
```

Get a key at [aistudio.google.com](https://aistudio.google.com).

---


## How This Is Useful in Production

In a real deployment, the webhook endpoint connects to carrier tracking APIs (FedEx, Maersk, DHL all offer event webhooks). The vendor scorecard becomes a living database of carrier reliability. Over time, the system learns which carriers fail on which routes in which seasons, and flags the risk before a new shipment is assigned, not after it's already late.

The blame trace gives operations teams an evidence packet they can use directly in vendor SLA reviews, insurance claims, and contract negotiations, work that currently takes hours of manual investigation.

---