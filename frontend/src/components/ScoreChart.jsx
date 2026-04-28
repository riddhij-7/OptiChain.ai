import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  const val = payload[0].value;
  return (
    <div style={{ background: "#111", border: "1px solid #222", borderRadius: 6, padding: "6px 10px", fontSize: 12 }}>
      <div style={{ color: "#888", marginBottom: 2 }}>{label}</div>
      <div style={{ color: val < 60 ? "var(--red)" : val < 75 ? "var(--amber)" : "var(--green)", fontWeight: 600 }}>
        {val}% on-time
      </div>
    </div>
  );
};

export default function ScoreChart({ data, currentRate }) {
  const lineColor = currentRate < 60 ? "var(--red)" : currentRate < 75 ? "var(--amber)" : "var(--green)";

  return (
    <div style={{ marginTop: 14 }}>
      <div style={{ fontSize: 10, color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: 8 }}>
        On-Time % — Last 6 Months
      </div>
      <ResponsiveContainer width="100%" height={90}>
        <LineChart data={data} margin={{ top: 4, right: 4, left: -28, bottom: 0 }}>
          <XAxis dataKey="month" tick={{ fontSize: 10, fill: "#555" }} axisLine={false} tickLine={false} />
          <YAxis domain={[40, 100]} tick={{ fontSize: 10, fill: "#555" }} axisLine={false} tickLine={false} />
          <Tooltip content={<CustomTooltip />} />
          <ReferenceLine y={60} stroke="var(--red)" strokeDasharray="3 3" strokeOpacity={0.4} />
          <Line
            type="monotone"
            dataKey="on_time_rate"
            stroke={lineColor}
            strokeWidth={2}
            dot={{ r: 3, fill: lineColor, strokeWidth: 0 }}
            activeDot={{ r: 5 }}
            isAnimationActive={true}
            animationDuration={600}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
