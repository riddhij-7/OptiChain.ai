const express = require("express");
const cors = require("cors");
const { scriptedEvents } = require("./webhook-events");

const app = express();
const PORT = process.env.PORT || 3001;

// Open CORS — public demo, no auth tokens on these endpoints
app.use(cors({ origin: "*", methods: ["GET", "POST"] }));

app.use(express.json());

// --- SSE client registry ---
let clients = [];

// --- Demo timer handles ---
let demoTimers = [];
let demoStarted = false;

function broadcast(event) {
  const payload = `data: ${JSON.stringify(event)}\n\n`;
  clients = clients.filter((res) => {
    try { res.write(payload); return true; }
    catch (_) { return false; } // drop dead connections
  });
  console.log(`[broadcast] ${event.type} → ${event.data?.shipment_id || ""} (${clients.length} clients)`);
}

// --- SSE endpoint ---
app.get("/events", (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no"); // disable Nginx/Render proxy buffering
  res.flushHeaders();

  // Confirm connection immediately
  res.write(`data: ${JSON.stringify({ type: "connected", message: "SSE live" })}\n\n`);

  clients.push(res);
  console.log(`[SSE] client connected — total: ${clients.length}`);

  // Heartbeat every 25s — keeps Render + browser connection alive
  const heartbeat = setInterval(() => {
    try { res.write(": ping\n\n"); } catch (_) { clearInterval(heartbeat); }
  }, 25000);

  // Start demo on first ever connection
  if (!demoStarted) {
    demoStarted = true;
    startDemoScript();
  }

  req.on("close", () => {
    clearInterval(heartbeat);
    clients = clients.filter((c) => c !== res);
    console.log(`[SSE] client disconnected — total: ${clients.length}`);
  });
});

// --- Manual webhook endpoint ---
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

// --- Reset endpoint ---
app.post("/reset", (req, res) => {
  demoTimers.forEach((t) => clearTimeout(t));
  demoTimers = [];
  demoStarted = false;
  broadcast({ type: "reset", timestamp: new Date().toISOString() });
  demoStarted = true;
  startDemoScript();
  res.json({ status: "ok", message: "Demo reset and restarted" });
});

// --- Health check (Render uses this to detect the service is up) ---
app.get("/status", (req, res) => {
  res.json({
    status: "running",
    clients_connected: clients.length,
    uptime_seconds: Math.floor(process.uptime()),
  });
});

// Root ping so Render health check passes
app.get("/", (req, res) => res.send("BlameChain backend running"));

// --- Scripted demo ---
function startDemoScript() {
  console.log("\n[demo] Scripted events armed. Starting in 5 seconds...\n");
  scriptedEvents.forEach(({ delay_ms, event }) => {
    const t = setTimeout(() => {
      console.log(`[demo] Firing event at t=${delay_ms / 1000}s`);
      broadcast({ type: "delay", timestamp: new Date().toISOString(), source: "scripted", data: event });
    }, delay_ms);
    demoTimers.push(t);
  });
}

app.listen(PORT, () => {
  console.log(`\n✓ BlameChain backend running on port ${PORT}`);
  console.log(`  SSE stream:   GET  /events`);
  console.log(`  Manual hook:  POST /webhook`);
  console.log(`  Reset demo:   POST /reset`);
  console.log(`  Health check: GET  /status\n`);
});
