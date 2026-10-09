# Requirements Status Matrix

| Feature | Frontend implementation | Backend implementation | Data source | Actual execution flow | Status | Evidence | Missing work |
|---------|-------------------------|------------------------|-------------|-----------------------|--------|----------|--------------|
| Shipment dashboard | Displays static data | None | `Shipment.json` | JSON -> Context -> UI | **PARTIALLY IMPLEMENTED** | `AppContext.jsx`, `ShipmentTracker.jsx` | Backend DB fetching, multi-tenant isolation |
| Vendor scorecards | Displays static data | None | `Vendors.json` | JSON -> Context -> UI | **PARTIALLY IMPLEMENTED** | `VendorScorecard.jsx` | Real historical metric aggregation |
| Shipment status/ETA | Visual only | None | `Shipment.json` | Static property display | **MOCKED** | `ShipmentTracker.jsx` | Dynamic recalculation based on actual movement |
| Delay detection | State management | Scripted mock events | `webhook-events.js` | Timer -> SSE -> Reducer | **MOCKED** | `server.js`, `AppContext.jsx` | Real-time threshold monitoring via GPS |
| Analyze Blame | API integration | None | LLM via Frontend | UI -> Gemini API -> UI | **IMPLEMENTED** | `geminiService.js`, `BlamePanel.jsx` | Move to backend, feed deterministic evidence |
| Gemini integration | Direct API call | None | Frontend API | `callGemini()` fetch | **IMPLEMENTED** | `geminiService.js` | Backend proxy to hide API key |
| Weather integration | None | None | N/A | N/A | **NOT IMPLEMENTED** | N/A | Open-Meteo API integration |
| Route/distance calc | None | None | N/A | N/A | **NOT IMPLEMENTED** | N/A | OSRM / Google Routes API integration |
| GPS tracking | None | None | N/A | N/A | **NOT IMPLEMENTED** | N/A | Webhook ingestion for Traccar |
| Traffic incidents | None | None | N/A | N/A | **NOT IMPLEMENTED** | N/A | Traffic API integration |
| Event webhooks | None | Endpoint exists | POST `/webhook` | POST -> broadcast() | **PARTIALLY IMPLEMENTED** | `server.js` | Persistence, auth, schema validation |
| SSE updates | EventSource listener | Stream broadcasting | `server.js` | backend -> browser | **IMPLEMENTED** | `server.js`, `AppContext.jsx` | N/A |
| Downstream impact | Visual cascade | Scripted property | `webhook-events.js` | LLM hallucination / mock | **MOCKED** | `webhook-events.js` | Graph-based route dependency analysis |
| Analytics/metrics | Visual only | None | `Vendors.json` | Static display | **MOCKED** | `VendorScorecard.jsx` | Database aggregation queries |
| Auth | JWT storing | JWT issuance | MongoDB | UI -> POST /login -> JWT | **PARTIALLY IMPLEMENTED** | `authController.js`, `Login.jsx` | Middleware protection on data routes |
| Persistence | User model only | Mongoose setup | MongoDB | Only user accounts | **PARTIALLY IMPLEMENTED** | `db.js`, `authController.js` | Shipment/Event persistence |

## Root-Cause Analysis Readiness

The current system **does not** perform evidence-based RCA. It simply feeds the current state into an LLM and asks for a JSON response containing a verdict.

**Proposed Pipeline State:**
1. Detect delay (MOCKED)
2. Collect relevant evidence (NOT IMPLEMENTED)
3. Normalize observations (NOT IMPLEMENTED)
4. Calculate derived features (NOT IMPLEMENTED)
5. Generate candidate causes (NOT IMPLEMENTED)
6. Score evidence (NOT IMPLEMENTED)
7. Produce ranked causes (NOT IMPLEMENTED)
8. Pass structured result to LLM (IMPLEMENTED, but with mock data)

## External Integrations Readiness

- **Google Gemini:** Configured on the frontend via `VITE_GEMINI_API_KEY`. (Must be moved to backend).
- **Open-Meteo, OSRM, Traccar, Google Routes:** No implementation files, configuration, or API calls exist in the repository.

## Testing and Verification

- **Current State:** No test files (`.test.js`, `.spec.js`) exist in the repository.
- **Recommended Minimal Plan:**
  - Unit tests for backend services (once extracted from frontend).
  - Webhook integration tests validating schema and idempotency.
  - End-to-End Synthetic Scenarios:
    1. Legitimate weather delay (Open-Meteo confirms storm).
    2. Weather coincidence (Storm reported, but historical data shows clear skies).
    3. Vendor breakdown (Requires deterministic risk rules).
    4. Customs hold.
    5. Insufficient evidence (LLM should output low confidence).
