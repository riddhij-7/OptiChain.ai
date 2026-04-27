// 4 scripted delay events that fire automatically during the demo.
// These simulate real carrier webhook pushes — the same format a
// FedEx / Maersk / DHL API would use to notify your system of a delay.
//
// Timing:
//   Event 1 — t=5s  : FastFreight vessel breakdown on SH-003 (Mumbai→Port Said)
//   Event 2 — t=15s : FastFreight customs failure on SH-002 (Colombo→Rotterdam)
//   Event 3 — t=30s : Weather delay on SH-001 (Dubai→Frankfurt) — NOT vendor fault
//   Event 4 — t=50s : FastFreight repeat breakdown on SH-004 (Nhava Sheva→Jebel Ali)
//
// Event 4 is the "nail in the coffin" for FastFreight's scorecard —
// a second vendor_fault incident on the same carrier in one demo session.

const scriptedEvents = [
  {
    delay_ms: 5000,
    event: {
      shipment_id: "SH-003",
      leg_id: "SH-003-L2",
      vendor_id: "V-002",
      vendor_name: "FastFreight Shipping",
      delay_hours: 14,
      reason: "breakdown",
      severity: "high",
      message:
        "Vessel MSC KIRAN reported engine malfunction at Arabian Sea (19.2°N, 65.8°E). Cargo transferred to backup vessel. Estimated delay: 14 hours. Downstream legs SH-003-L3 and SH-003-L4 now at risk.",
      location: {
        lat: 19.2,
        lng: 65.8,
        label: "Arabian Sea",
      },
      downstream_legs_at_risk: ["SH-003-L3", "SH-003-L4"],
    },
  },
  {
    delay_ms: 15000,
    event: {
      shipment_id: "SH-002",
      leg_id: "SH-002-L3",
      vendor_id: "V-002",
      vendor_name: "FastFreight Shipping",
      delay_hours: 36,
      reason: "customs",
      severity: "high",
      message:
        "Colombo transshipment held by Sri Lanka Customs — incomplete HS code declaration on pharmaceutical documentation. FastFreight agent failed to file Form C-82 prior to arrival. Delay: 36 hours minimum.",
      location: {
        lat: 6.9,
        lng: 79.8,
        label: "Colombo Port, Sri Lanka",
      },
      downstream_legs_at_risk: ["SH-002-L4"],
    },
  },
  {
    delay_ms: 30000,
    event: {
      shipment_id: "SH-001",
      leg_id: "SH-001-L3",
      vendor_id: "V-003",
      vendor_name: "EuroLink Logistics",
      delay_hours: 6,
      reason: "weather",
      severity: "medium",
      message:
        "Sandstorm advisory issued across UAE airspace (Dubai/Abu Dhabi). All cargo flights grounded until further notice per Dubai CAA directive. Estimated delay 6 hours. External weather event — not carrier fault.",
      location: {
        lat: 25.2,
        lng: 55.3,
        label: "Dubai Airport, UAE",
      },
      downstream_legs_at_risk: ["SH-001-L4"],
    },
  },
  {
    delay_ms: 50000,
    event: {
      shipment_id: "SH-004",
      leg_id: "SH-004-L2",
      vendor_id: "V-002",
      vendor_name: "FastFreight Shipping",
      delay_hours: 20,
      reason: "breakdown",
      severity: "critical",
      message:
        "Vessel MSC FLORA mechanical failure confirmed at Nhava Sheva Port prior to departure. Port engineer report filed. Second FastFreight vessel incident this month. Cargo being transferred to alternate vessel — departure delayed 20 hours.",
      location: {
        lat: 18.95,
        lng: 72.95,
        label: "Nhava Sheva Port, Mumbai",
      },
      downstream_legs_at_risk: ["SH-004-L3", "SH-004-L4"],
    },
  },
];

module.exports = { scriptedEvents };