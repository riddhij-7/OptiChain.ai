const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;
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
  "blame_score": <0-100 integer, 0=no fault, 100=full fault>,
  "vendor_fault": <true|false>,
  "root_cause": "<one sentence — what specifically went wrong>",
  "evidence": [
    "<evidence point 1 — specific fact from the data>",
    "<evidence point 2>",
    "<evidence point 3>"
  ],
  "downstream_impact": "<how many legs affected and estimated total delay cascade>",
  "recommendation": "<one actionable recommendation for future shipments>",
  "risk_warning": "<if vendor has pattern of failures, flag it. Otherwise null>",
  "summary": "<2-3 sentence plain English evidence packet for the operations team>"
  
  IMPORTANT: Keep "summary" under 100 words. Keep all string values concise. Total response must fit in 1500 tokens.
}
`;

  const response = await fetch(GEMINI_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 2048,
        
      },
    }),
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err?.error?.message || "Gemini API error");
  }

  const data = await response.json();
  const raw = data.candidates?.[0]?.content?.parts?.[0]?.text;
  console.log("GEMINI RAW:", raw);

  if (!raw) throw new Error("Empty response from Gemini");

  // Strip markdown code fences if Gemini adds them anyway
  const cleaned = raw
  .replace(/```json/gi, "")
  .replace(/```/g, "")
  .trim();

// Extract JSON object if there's extra text around it
const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
if (!jsonMatch) throw new Error("No JSON object found in Gemini response");

try {
  return JSON.parse(jsonMatch[0]);
} catch {
  throw new Error("Failed to parse Gemini response as JSON");
}
}