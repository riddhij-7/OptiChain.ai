const mongoose = require("mongoose");

const vendorSchema = new mongoose.Schema(
  {
    vendorId: { type: String, required: true, unique: true }, // e.g. V-001
    name: { type: String, required: true },
    type: { type: String }, // e.g. "Road & Last Mile", "Sea Freight"
    region: { type: String },
    contact: { type: String },
    onTimeRate: { type: Number, default: 100 },
    totalShipments: { type: Number, default: 0 },
    delayedShipments: { type: Number, default: 0 },
    avgDelayHours: { type: Number, default: 0 },
    blameScore: { type: Number, default: 0 },
    status: { type: String, enum: ["good", "at_risk", "critical"], default: "good" },
    monthlyPerformance: [
      {
        month: String,
        onTimeRate: Number,
      }
    ],
    riskRoutes: [
      {
        route: String,
        season: String,
        onTimeRate: Number,
        reason: String,
      }
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Vendor", vendorSchema);
