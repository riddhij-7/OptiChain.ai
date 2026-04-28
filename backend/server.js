const express = require("express");
const cors = require("cors");
const { scriptedEvents } = require("./webhook-events");

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// --- SSE client registry ---
let clients = [];

// --- Demo timer handles (so we can cancel on reset) ---
let demoTimers = [];

function broadcast(event) {
  const payload = `data: ${JSON.stringify(event)}\n\n`;
  clients.forEach((res) => res.write(payload));
  console.log(`[broadcast] ${event.type} → ${event.data?.shipment_id || ""}`);
}

// --- SSE endpoint (frontend connects here) ---
app.get("/events", (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  // Send a heartbeat immediately so frontend knows connection is live
  res.write(`data: ${JSON.stringify({ type: "connected", message: "SSE live" })}\n\n`);

  clients.push(res);
  console.log(`[SSE] client connected — total: ${clients.length}`);

  req.on("close", () => {
    clients = clients.filter((c) => c !== res);
    console.log(`[SSE] client disconnected — total: ${clients.length}`);
  });
});

// --- Manual webhook endpoint (for judge Q&A / custom triggers) ---
app.post("/webhook", (req, res) => {
  const event = req.body;

  if (!event.shipment_id || !event.leg_id) {
    return res.status(400).json({ error: "shipment_id and leg_id are required" });
  }

  const webhookEvent = {
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
  };

  broadcast(webhookEvent);
  res.json({ status: "ok", event: webhookEvent });
});

// --- Reset endpoint (resets demo state for all connected clients) ---
app.post("/reset", (req, res) => {
  // Cancel any pending scripted timers
  demoTimers.forEach((t) => clearTimeout(t));
  demoTimers = [];

  // Tell all clients to reset their state
  broadcast({ type: "reset", timestamp: new Date().toISOString() });

  // Re-arm the scripted demo from scratch
  startDemoScript();

  res.json({ status: "ok", message: "Demo reset and restarted" });
});

// --- Status endpoint (health check) ---
app.get("/status", (req, res) => {
  res.json({
    status: "running",
    clients_connected: clients.length,
    uptime_seconds: Math.floor(process.uptime()),
  });
});

// --- Start scripted demo events ---
// Stores timer handles so they can be cancelled on reset
function startDemoScript() {
  console.log("\n[demo] Scripted events armed. Starting in 5 seconds...\n");

  scriptedEvents.forEach(({ delay_ms, event }) => {
    const t = setTimeout(() => {
      console.log(`[demo] Firing scripted event at t=${delay_ms / 1000}s`);
      broadcast({ type: "delay", timestamp: new Date().toISOString(), source: "scripted", data: event });
    }, delay_ms);
    demoTimers.push(t);
  });
}

app.listen(PORT, () => {
  console.log(`\n✓ BlameChain webhook server running on http://localhost:${PORT}`);
  console.log(`  SSE stream:   GET  http://localhost:${PORT}/events`);
  console.log(`  Manual hook:  POST http://localhost:${PORT}/webhook`);
  console.log(`  Reset demo:   POST http://localhost:${PORT}/reset`);
  console.log(`  Health check: GET  http://localhost:${PORT}/status\n`);

  startDemoScript();
});