const mongoose = require("mongoose");
const dotenv = require("dotenv");
const connectDB = require("./config/db");
const Vendor = require("./models/Vendor");
const Shipment = require("./models/Shipment");

// Load env vars
dotenv.config();

// Connect to DB
connectDB();

const shipmentsData = require("../frontend/src/data/Shipment.json");
const vendorsData = require("../frontend/src/data/Vendors.json");

const importData = async () => {
  try {
    await Vendor.deleteMany();
    await Shipment.deleteMany();

    const formattedVendors = vendorsData.map((v) => ({
      vendorId: v.id,
      name: v.name,
      type: v.type,
      region: v.region,
      contact: v.contact,
      onTimeRate: v.on_time_rate,
      totalShipments: v.total_shipments,
      delayedShipments: v.delayed_shipments,
      avgDelayHours: v.avg_delay_hours,
      blameScore: v.blame_score,
      status: v.status,
      monthlyPerformance: v.monthly_performance,
      riskRoutes: v.risk_routes,
    }));

    const formattedShipments = shipmentsData.map((s) => ({
      shipmentId: s.id,
      title: s.title,
      origin: s.origin,
      destination: s.destination,
      customer: s.customer,
      totalValue: s.total_value,
      status: s.status,
      legs: s.legs.map((l) => ({
        legId: l.leg_id,
        sequence: l.sequence,
        vendorId: l.vendor_id,
        vendorName: l.vendor_name,
        type: l.type,
        origin: l.origin,
        destination: l.destination,
        promisedETA: l.promised_eta ? new Date(l.promised_eta) : null,
        actualETA: l.actual_eta ? new Date(l.actual_eta) : null,
        departedAt: l.departed_at ? new Date(l.departed_at) : null,
        status: l.status,
        notes: l.notes,
      })),
    }));

    await Vendor.insertMany(formattedVendors);
    await Shipment.insertMany(formattedShipments);

    console.log("Data Imported!");
    process.exit();
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

if (process.argv[2] === "-d") {
  // destroy data
} else {
  importData();
}
