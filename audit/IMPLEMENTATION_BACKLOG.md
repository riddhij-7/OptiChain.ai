# Incremental Implementation Roadmap

## P0: Correctness, Security, and Immediate Blockers
**Objective:** Secure the application and move logic to the backend.
- **Task:** Move Gemini API calls to the backend.
  - **Files:** `server.js`, `frontend/src/services/geminiService.js`
  - **Acceptance Criteria:** Frontend no longer requires `VITE_GEMINI_API_KEY`. Backend exposes `/api/analyze` endpoint.
- **Task:** Implement Webhook Security.
  - **Files:** `server.js`
  - **Acceptance Criteria:** `/webhook` requires a valid API key or signature to process events.

## P1: First End-to-End Evidence-Based RCA Flow
**Objective:** Replace pure LLM hallucination with deterministic evidence gathering.
- **Task:** Integrate a weather API (e.g., Open-Meteo) on the backend.
  - **Files:** `backend/services/weatherService.js`, `server.js`
  - **Acceptance Criteria:** When a delay is reported as "weather", the backend fetches historical weather for the shipment's last known location and time.
- **Task:** Deterministic Root-Cause Generation.
  - **Files:** `backend/services/rcaService.js`
  - **Acceptance Criteria:** Backend scores evidence deterministically before passing it to Gemini for a natural language summary.

## P2: Persistence and Reliable Event Processing
**Objective:** Prevent data loss on reload and establish source of truth.
- **Task:** Database Integration for Shipments and Events.
  - **Files:** `backend/models/Shipment.js`, `backend/models/ShipmentEvent.js`, `backend/routes/shipmentRoutes.js`, `frontend/src/context/AppContext.jsx`
  - **Acceptance Criteria:** Frontend fetches shipments on load. Events are saved to MongoDB before being broadcasted via SSE.
- **Task:** Event Idempotency.
  - **Files:** `backend/server.js`
  - **Acceptance Criteria:** Duplicate webhook events with the same `eventId` are ignored.

## P3: Live GPS and Additional External Integrations
**Objective:** Replace mocked movement with real tracking.
- **Task:** Traccar or external GPS integration.
  - **Files:** `backend/services/gpsService.js`
  - **Acceptance Criteria:** Backend consumes real GPS webhooks to update shipment location dynamically.
- **Task:** Route/ETA recalculation (OSRM/Google Routes).
  - **Acceptance Criteria:** `actual_eta` is recalculated dynamically based on GPS updates.

## P4: Multi-User Readiness, Analytics, and Production Hardening
**Objective:** Prepare for real customer usage.
- **Task:** JWT Authorization enforcement.
  - **Files:** `backend/middleware/authMiddleware.js`, `server.js`
  - **Acceptance Criteria:** All API routes are protected. Users only see shipments assigned to their organization.
- **Task:** Analytics Dashboard.
  - **Acceptance Criteria:** Vendor scorecards query aggregated historical data from the database.
