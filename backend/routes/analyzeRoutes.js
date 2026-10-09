const express = require("express");
const { analyzeShipmentBlame, analyzeVendors } = require("../controllers/analyzeController");

const router = express.Router();

router.post("/shipments/:id/analyze", analyzeShipmentBlame);
router.post("/vendors", analyzeVendors);

module.exports = router;
