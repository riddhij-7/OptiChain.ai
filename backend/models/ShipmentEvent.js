const mongoose = require("mongoose");

const shipmentEventSchema = new mongoose.Schema(
  {
    shipmentId: { type: String, required: true }, // or ObjectId ref Shipment
    legId: { type: String },
    vendorId: { type: String },
    eventType: { type: String, required: true }, // "delay", "status_update", "location_update"
    status: { type: String },
    delayHours: { type: Number },
    reason: { type: String },
    message: { type: String },
    timestamp: { type: Date, default: Date.now },
    source: { type: String }, // "webhook", "manual", "scripted"
  },
  { timestamps: true }
);

module.exports = mongoose.model("ShipmentEvent", shipmentEventSchema);
