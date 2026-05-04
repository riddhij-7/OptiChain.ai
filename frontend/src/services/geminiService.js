const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;

async function callGemini(prompt) {
  const response = await fetch(GEMINI_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.2, maxOutputTokens: 3000 },
    }),
  });
  if (!response.ok) {
    const err = await response.json();
    throw new Error(err?.error?.message || "Gemini API error");
  }
  const data = await response.json();
  const raw = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!raw) throw new Error("Empty response from Gemini");
  const cleaned = raw.replace(/```json/gi, "").replace(/```/g, "").trim();
  const jsonMatch = cleaned.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
if (!jsonMatch) throw new Error("No JSON object found in Gemini response");
  try { return JSON.parse(jsonMatch[0]); }
  catch { throw new Error("Failed to parse Gemini response as JSON"); }
}

export async function runBlameTrace({ shipment, leg, vendors }) {
  const vendor = vendors.find((v) => v.id === leg.vendor_id);

  const prompt = `
You are a supply chain accountability AI called BlameChain.
Analyze this shipment delay and assign blame.

SHIPMENT:
- ID: ${shipment.id}
- Route: ${shipment.origin} → ${shipment.destination}
- Customer: ${shipment.customer}
- Total Value: $${shipment.total_value}

DELAYED LEG:
- Leg ID: ${leg.leg_id}
- Sequence: Leg ${leg.sequence} of ${shipment.legs.length}
- Vendor: ${leg.vendor_name} (ID: ${leg.vendor_id})
- Route: ${leg.origin} → ${leg.destination}
- Transport: ${leg.type}
- Promised ETA: ${leg.promised_eta}
- Delay: ${leg.delay_hours} hours
- Reason code: ${leg.reason}
- Carrier message: "${leg.delay_message}"

ALL LEGS STATUS:
${shipment.legs.map((l) => `  Leg ${l.sequence} (${l.vendor_name}): ${l.status}${l.delay_hours ? ` — +${l.delay_hours}h delay` : ""}`).join("\n")}

VENDOR HISTORICAL RECORD:
- On-time rate: ${vendor?.on_time_rate ?? "unknown"}%
- Total shipments handled: ${vendor?.total_shipments ?? "unknown"}
- Past delay incidents: ${vendor?.incidents?.length ?? 0}
- Vendor fault incidents: ${vendor?.incidents?.filter((i) => i.vendor_fault).length ?? 0}
- Known risk routes: ${vendor?.risk_routes?.map((r) => r.route).join(", ") || "none"}
- Current blame score: ${vendor?.blame_score ?? 0}/100

REASON CODES:
- "breakdown" = mechanical/vessel failure → likely vendor fault
- "customs" = documentation issues → likely vendor fault if paperwork related
- "weather" = external weather event → NOT vendor fault
- "vendor_fault" = explicitly vendor's responsibility

Respond ONLY with a valid JSON object. No markdown, no backticks, no explanation outside the JSON.

{
  "verdict": "VENDOR FAULT" | "EXTERNAL CAUSE" | "PARTIAL FAULT",
  "blame_score": <0-100 integer>,
  "vendor_fault": <true|false>,
  "root_cause": "<one sentence>",
  "evidence": ["<point 1>", "<point 2>", "<point 3>"],
  "downstream_impact": "<legs affected and delay cascade>",
  "recommendation": "<one actionable recommendation>",
  "risk_warning": "<pattern warning or null>",
  "summary": "<2-3 sentence evidence packet, under 100 words>"
}
`;

  return callGemini(prompt);
}

export async function runVendorAnalysis(vendors) {
  const vendorSummaries = vendors.map((v) => ({
    id: v.id,
    name: v.name,
    type: v.type,
    region: v.region,
    on_time_rate: v.on_time_rate,
    total_shipments: v.total_shipments,
    delayed_shipments: v.delayed_shipments,
    avg_delay_hours: v.avg_delay_hours,
    blame_score: v.blame_score,
    fault_incidents: v.incidents.filter((i) => i.vendor_fault).length,
    total_incidents: v.incidents.length,
    risk_routes_count: v.risk_routes?.length ?? 0,
    monthly_trend: v.monthly_performance.map((m) => m.on_time_rate),
  }));

  const prompt = `
You are a supply chain risk intelligence AI called BlameChain.
Analyze these ${vendors.length} vendors and produce a comparative reliability assessment.

VENDOR DATA:
${JSON.stringify(vendorSummaries, null, 2)}

Evaluate each vendor on:
1. Reliability — on-time rate trend (improving/declining/stable), fault incident ratio
2. Risk level — blame score, avg delay hours, risk routes
3. Overall recommendation — safe to use, monitor closely, or avoid

Respond ONLY with a valid JSON object in this exact shape:

{
  "generated_at": "<ISO timestamp>",
  "fleet_health": "<one sentence summary of the overall vendor fleet health>",
  "most_reliable": "<vendor id of most reliable vendor>",
  "highest_risk": "<vendor id of highest risk vendor>",
  "vendors": [
    {
      "id": "<vendor id>",
      "reliability_tier": "RELIABLE" | "MONITOR" | "HIGH_RISK",
      "trend": "IMPROVING" | "DECLINING" | "STABLE",
      "risk_factors": ["<factor 1>", "<factor 2>"],
      "strengths": ["<strength 1>"],
      "ai_verdict": "<2 sentence plain English assessment>",
      "action": "CONTINUE" | "REVIEW_CONTRACT" | "ESCALATE"
    }
  ]
}
  CRITICAL: Your entire response must be a single valid JSON object starting with { and ending with }.
Do not include any text, explanation, or markdown before or after the JSON.
Keep all string values under 80 words. Total response must be under 1800 tokens.
`;

  return callGemini(prompt);
}
