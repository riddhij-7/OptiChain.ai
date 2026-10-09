const { analyzeShipmentBlame, analyzeVendors } = require("./controllers/analyzeController");

async function runTests() {
  let passed = 0;
  let failed = 0;
  
  const mockRes = () => {
    const res = {};
    res.status = function (code) { this.statusCode = code; return this; };
    res.json = function (data) { this.data = data; return this; };
    return res;
  };

  console.log("--- Running Tests ---");

  // Test 1: Missing shipment data
  let req = { body: {} };
  let res = mockRes();
  await analyzeShipmentBlame(req, res);
  if (res.statusCode === 400) passed++; else failed++;
  console.log("Test 1 (Validation - missing shipment):", res.statusCode === 400 ? "PASS" : "FAIL");

  // Test 2: Missing vendor data
  req = { body: {} };
  res = mockRes();
  await analyzeVendors(req, res);
  if (res.statusCode === 400) passed++; else failed++;
  console.log("Test 2 (Validation - missing vendors):", res.statusCode === 400 ? "PASS" : "FAIL");

  // Test 3: Missing API Key (503 Service Unavailable)
  process.env.GEMINI_API_KEY = "";
  req = { body: { shipment: {id: 1, origin: "A", destination: "B", customer: "C", total_value: 100, legs: []}, leg: {leg_id: 1, vendor_id: "a", sequence: 1, origin: "A", destination: "B", type: "road", promised_eta: "now", delay_hours: 1, reason: "weather", delay_message: "hi"}, vendors: [{id: "a"}] } };
  res = mockRes();
  await analyzeShipmentBlame(req, res);
  if (res.statusCode === 503) passed++; else failed++;
  console.log("Test 3 (Configuration - missing API key 503):", res.statusCode === 503 ? "PASS" : "FAIL");

  console.log(`\nResults: ${passed} passed, ${failed} failed`);
}

runTests();
