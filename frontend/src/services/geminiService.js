const BACKEND = import.meta.env.VITE_BACKEND_URL || "http://localhost:3001";

export async function runBlameTrace({ shipment, leg, vendors }) {
  const response = await fetch(`${BACKEND}/api/analyze/shipments/${shipment.id}/analyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ shipment, leg, vendors }),
  });
  
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || "Failed to analyze blame");
  }
  
  return response.json();
}

export async function runVendorAnalysis(vendors) {
  const response = await fetch(`${BACKEND}/api/analyze/vendors`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ vendors }),
  });
  
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || "Failed to analyze vendors");
  }
  
  return response.json();
}
