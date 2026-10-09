const geminiService = require("../services/geminiService");

const analyzeShipmentBlame = async (req, res) => {
  try {
    const { shipment, leg, vendors } = req.body;
    if (!shipment || !leg || !vendors) {
      return res.status(400).json({ error: "Missing required data: shipment, leg, or vendors" });
    }
    const result = await geminiService.runBlameTrace({ shipment, leg, vendors });
    res.json(result);
  } catch (error) {
    console.error("[analyzeShipmentBlame] error:", error.message);
    // Explicitly handle configuration error to return 503 Service Unavailable
    if (error.message.includes("GEMINI_API_KEY is not configured")) {
      return res.status(503).json({ error: "Service unavailable: Missing AI configuration" });
    }
    res.status(500).json({ error: error.message || "Failed to analyze blame" });
  }
};

const analyzeVendors = async (req, res) => {
  try {
    const { vendors } = req.body;
    if (!vendors || !Array.isArray(vendors)) {
      return res.status(400).json({ error: "Missing or invalid vendors data" });
    }
    const result = await geminiService.runVendorAnalysis(vendors);
    res.json(result);
  } catch (error) {
    console.error("[analyzeVendors] error:", error.message);
    if (error.message.includes("GEMINI_API_KEY is not configured")) {
      return res.status(503).json({ error: "Service unavailable: Missing AI configuration" });
    }
    res.status(500).json({ error: error.message || "Failed to analyze vendors" });
  }
};

module.exports = {
  analyzeShipmentBlame,
  analyzeVendors,
};
