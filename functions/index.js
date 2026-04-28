const { onRequest } = require("firebase-functions/v2/https");
const { setGlobalOptions } = require("firebase-functions/v2");
const express = require("express");
const cors = require("cors");

// Keep functions warm in us-central1, allow up to 10 concurrent containers
setGlobalOptions({ maxInstances: 10, region: "us-central1" });

// ---------------------------------------------------------------------------
// Scripted demo events (same as backend/webhook-events.js)
// ---------------------------------------------------------------------------
const scriptedEvents = [
  {
    delay_ms: 5000,
    event: {
      shipment_id: "SH-003", leg_id: "SH-003-L2",
      vendor_id: "V-002", vendor_name: "FastFreight Shipping",
      delay_hours: 14, reason: "breakdown", severity: "high",
      message: "Vessel MSC KIRAN reported engine malfunction at Arabian Sea (19.2°N, 65.8°E). Cargo transferred to backup vessel. Estimated delay: 14 hours. Downstream legs SH-003-L3 and SH-003-L4 now at risk.",
      downstream_legs_at_risk: ["SH-003-L3", "SH-003-L4"],
    },
  },
  {
    delay_ms: 15000,
    event: {
      shipment_id: "SH-002", leg_id: "SH-002-L3",
      vendor_id: "V-002", vendor_name: "FastFreight Shipping",
      delay_hours: 36, reason: "customs", severity: "high",
      message: "Colombo transshipment held by Sri Lanka Customs — incomplete HS code declaration on pharmaceutical documentation. FastFreight agent failed to file Form C-82 prior to arrival. Delay: 36 hours minimum.",
      downstream_legs_at_risk: ["SH-002-L4"],
    },
  },
  {
    delay_ms: 30000,
    event: {
      shipment_id: "SH-001", leg_id: "SH-001-L3",
      vendor_id: "V-003", vendor_name: "EuroLink Logistics",
      delay_hours: 6, reason: "weather", severity: "medium",
      message: "Sandstorm advisory issued across UAE airspace (Dubai/Abu Dhabi). All cargo flights grounded until further notice per Dubai CAA directive. Estimated delay 6 hours. External weather event — not carrier fault.",
      downstream_legs_at_risk: ["SH-001-L4"],
    },
  },
  {
    delay_ms: 50000,
    event: {
      shipment_id: "SH-004", leg_id: "SH-004-L2",
      vendor_id: "V-002", vendor_name: "FastFreight Shipping",
      delay_hours: 20, reason: "breakdown", severity: "critical",
      message: "Vessel MSC FLORA mechanical failure confirmed at Nhava Sheva Port prior to departure. Port engineer report filed. Second FastFreight vessel incident this month. Cargo being transferred to alternate vessel — departure delayed 20 hours.",
      downstream_legs_at_risk: ["SH-004-L3", "SH-004-L4"],
    },
  },
];

// ---------------------------------------------------------------------------
// SSE state (module-level — shared across warm container invocations)
// ---------------------------------------------------------------------------
let clients = [];
let demoTimers = [];

function broadcast(event) {
  const payload = `data: ${JSON.stringify(event)}\n\n`;
  clients.forEach((res) => {
    try { res.write(payload); } catch (_) { /* client gone */ }
  });
}

function startDemoScript() {
  demoTimers.forEach((t) => clearTimeout(t));
  demoTimers = [];
  scriptedEvents.forEach(({ delay_ms, event }) => {
    const t = setTimeout(() => {
      broadcast({ type: "delay", timestamp: new Date().toISOString(), source: "scripted", data: event });
    }, delay_ms);
    demoTimers.push(t);
  });
}

// ---------------------------------------------------------------------------
// Express app
// ---------------------------------------------------------------------------
const app = express();

app.use(cors({ origin: true }));
app.use(express.json());

// SSE stream
app.get("/events", (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders();

  res.write(`data: ${JSON.stringify({ type: "connected", message: "SSE live" })}\n\n`);
  clients.push(res);

  // Start demo on first connection
  if (clients.length === 1) startDemoScript();

  req.on("close", () => {
    clients = clients.filter((c) => c !== res);
  });
});

// Manual webhook trigger
app.post("/webhook", (req, res) => {
  const event = req.body;
  if (!event.shipment_id || !event.leg_id) {
    return res.status(400).json({ error: "shipment_id and leg_id are required" });
  }
  broadcast({
    type: "delay",
    timestamp: new Date().toISOString(),
    source: "manual",
    data: {
      shipment_id: event.shipment_id,
      leg_id: event.leg_id,
      vendor_id: event.vendor_id,
      vendor_name: event.vendor_name,
      delay_hours: event.delay_hours,
      reason: event.reason,
      message: event.message || "Manual delay reported via webhook",
    },
  });
  res.json({ status: "ok" });
});

// Reset — cancel timers, broadcast reset, re-arm demo
app.post("/reset", (req, res) => {
  demoTimers.forEach((t) => clearTimeout(t));
  demoTimers = [];
  broadcast({ type: "reset", timestamp: new Date().toISOString() });
  startDemoScript();
  res.json({ status: "ok", message: "Demo reset and restarted" });
});

// Health check
app.get("/status", (req, res) => {
  res.json({ status: "running", clients_connected: clients.length });
});

// ---------------------------------------------------------------------------
// Export as Firebase Function
// ---------------------------------------------------------------------------
exports.api = onRequest({ timeoutSeconds: 540, invoker: "public" }, app);
