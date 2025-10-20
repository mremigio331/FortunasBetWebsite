import React from "react";

// Simple SVG line chart (no external deps)
// Props:
// - series: [{ user_id, name, color, pointsByWeek: { [week]: number } }]
// - weeks: array of week identifiers in display order
// The chart draws lines per user across weeks and a legend.
const UserPointsLineChart = ({
  series = [],
  weeks = [],
  height = 160,
  width = 800,
}) => {
  if (!series || series.length === 0 || !weeks || weeks.length === 0)
    return null;

  // Compute max value
  let maxVal = 0;
  series.forEach((s) => {
    weeks.forEach((w) => {
      const v = s.pointsByWeek?.[w] || 0;
      if (v > maxVal) maxVal = v;
    });
  });

  // padding
  const pad = { top: 12, right: 12, bottom: 28, left: 28 };
  const innerW = width - pad.left - pad.right;
  const innerH = height - pad.top - pad.bottom;

  const x = (i) => pad.left + innerW * (i / Math.max(1, weeks.length - 1));
  const y = (v) =>
    pad.top + innerH - (maxVal === 0 ? 0 : (v / maxVal) * innerH);

  const pointsForSeries = (s) =>
    weeks.map((w, i) => `${x(i)},${y(s.pointsByWeek?.[w] || 0)}`).join(" ");

  return (
    <div style={{ overflowX: "auto" }}>
      <svg width={Math.max(width, weeks.length * 80)} height={height}>
        <defs>
          <linearGradient id="gridGrad" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#f5f5f5" />
            <stop offset="100%" stopColor="#ffffff" />
          </linearGradient>
        </defs>

        {/* background */}
        <rect
          x={0}
          y={0}
          width={Math.max(width, weeks.length * 80)}
          height={height}
          fill="url(#gridGrad)"
          rx={6}
        />

        {/* grid lines and week labels */}
        {weeks.map((w, i) => (
          <g key={w}>
            <line
              x1={x(i)}
              x2={x(i)}
              y1={pad.top}
              y2={pad.top + innerH}
              stroke="#eee"
            />
            <text
              x={x(i)}
              y={pad.top + innerH + 18}
              fontSize={11}
              textAnchor="middle"
              fill="#333"
            >
              {String(w)}
            </text>
          </g>
        ))}

        {/* y axis labels */}
        {[0, 0.25, 0.5, 0.75, 1].map((t, idx) => {
          const val = Math.round(maxVal * (1 - t));
          return (
            <g key={idx}>
              <text
                x={6}
                y={pad.top + 4 + innerH * t}
                fontSize={10}
                fill="#666"
              >
                {val}
              </text>
              <line
                x1={pad.left}
                x2={pad.left + innerW}
                y1={pad.top + innerH * t}
                y2={pad.top + innerH * t}
                stroke="#f0f0f0"
              />
            </g>
          );
        })}

        {/* lines */}
        {series.map((s, idx) => (
          <g key={s.user_id}>
            <polyline
              fill="none"
              stroke={
                s.color || ["#1890ff", "#52c41a", "#faad14", "#ff4d4f"][idx % 4]
              }
              strokeWidth={2}
              points={pointsForSeries(s)}
            />
            {/* points */}
            {weeks.map((w, i) => (
              <circle
                key={w}
                cx={x(i)}
                cy={y(s.pointsByWeek?.[w] || 0)}
                r={3}
                fill={
                  s.color ||
                  ["#1890ff", "#52c41a", "#faad14", "#ff4d4f"][idx % 4]
                }
              />
            ))}
          </g>
        ))}
      </svg>

      {/* legend */}
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 8 }}>
        {series.map((s, i) => (
          <div
            key={s.user_id}
            style={{ display: "flex", alignItems: "center", gap: 8 }}
          >
            <div
              style={{
                width: 10,
                height: 10,
                background:
                  s.color ||
                  ["#1890ff", "#52c41a", "#faad14", "#ff4d4f"][i % 4],
                borderRadius: 2,
              }}
            />
            <div style={{ fontSize: 12 }}>{s.name}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default UserPointsLineChart;
