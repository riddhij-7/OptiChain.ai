const mongoose = require("mongoose");

const legSchema = new mongoose.Schema({
  legId: { type: String, required: true }, // e.g. SH-001-L1
  sequence: { type: Number, required: true },
  vendorId: { type: String, required: true }, // referencing vendorId string (V-001) for easier migration, or ObjectId if ref
  vendorName: { type: String },
  type: { type: String }, // road, sea, air
  origin: { type: String },
  destination: { type: String },
  promisedETA: { type: Date },
  actualETA: { type: Date },
  departedAt: { type: Date },
  status: { type: String, enum: ["pending", "on_track", "delayed", "completed"], default: "pending" },
  notes: { type: String }
});

const shipmentSchema = new mongoose.Schema(
  {
    shipmentId: { type: String, required: true, unique: true }, // e.g. SH-001
    title: { type: String },
    origin: { type: String },
    destination: { type: String },
    customer: { type: String },
    totalValue: { type: Number },
    status: { type: String, enum: ["pending", "on_track", "delayed", "at_risk", "delivered", "cancelled"], default: "pending" },
    legs: [legSchema],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Shipment", shipmentSchema);
