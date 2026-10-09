# Data and Event Architecture

## Current Data Flow
1. **Initial Load:** Shipments and vendors are statically loaded from local JSON files (`Shipment.json`, `Vendors.json`) into the React Context (`AppContext.jsx`).
2. **Event Generation:** `server.js` executes scripted timers to push predefined mock events to SSE clients.
3. **State Management:** Events modify the in-memory React state, meaning any page refresh wipes event history and restores the static JSON state.
4. **LLM Integration:** Frontend code sends current shipment/leg context directly to the Gemini API and parses the response to apply blame scores.

## Proposed Normalized Event Schema

To transition from mocked JSON to a robust, event-driven architecture, implement the following canonical event schema:

```json
{
  "eventId": "EVT-20261009-1A2B3C",
  "shipmentId": "SH-003",
  "eventType": "gps_update",
  "source": {
    "provider": "traccar",
    "deviceId": "DEV-9988",
    "freshness": 1200 
  },
  "observedAt": "2026-10-09T17:15:00Z",
  "receivedAt": "2026-10-09T17:15:01Z",
  "location": {
    "lat": 19.2,
    "lng": 65.8,
    "label": "Arabian Sea"
  },
  "payload": {
    "speed_kmh": 22.5,
    "heading": 135
  },
  "units": "metric",
  "provenance": "verified",
  "validationStatus": "valid"
}
```

## Architectural Risks & Gaps
- **Duplicate Event Risks:** Lacks idempotency keys. Repeated webhook submissions will apply multiple delays.
- **Missing Timestamps:** Webhook payloads currently rely on the server generating `timestamp: new Date().toISOString()`, rather than trusting or validating an `observedAt` time.
- **Stale/Invalid Data:** No handling for delayed or out-of-order events.
- **No Event Persistence:** Events only exist in memory on the frontend and disappear upon reload.
- **External API Correlation:** To correlate external observations (e.g. Open-Meteo weather), the backend must track the precise location and expected path of the shipment, fetching localized data upon receiving an anomaly rather than relying entirely on user-provided or mock data.
