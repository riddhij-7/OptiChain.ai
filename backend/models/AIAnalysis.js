const mongoose = require("mongoose");

const aiAnalysisSchema = new mongoose.Schema(
  {
    shipmentId: { type: String, required: true },
    eventId: { type: mongoose.Schema.Types.ObjectId, ref: "ShipmentEvent" },
    verdict: { type: String }, // "Vendor Fault", "External Cause", "Partial Fault"
    blameScore: { type: Number },
    confidence: { type: String },
    evidence: [{ type: String }],
    downstreamImpact: { type: String },
    recommendation: { type: String },
    rawResponse: { type: Object },
    expiresAt: { type: Date }, // For TTL caching
  },
  { timestamps: true }
);

// TTL index to automatically remove cached analysis after 15 minutes if desired.
// Currently just keeping it for history, so not strictly setting a MongoDB TTL index,
// but we will use `expiresAt` in the application logic to determine freshness.

module.exports = mongoose.model("AIAnalysis", aiAnalysisSchema);
