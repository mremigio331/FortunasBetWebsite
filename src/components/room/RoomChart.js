import React from "react";
import { Typography, Space } from "antd";
import { TrophyOutlined } from "@ant-design/icons";
import UserPointsLineChart from "./UserPointsLineChart";

// RoomChart: aggregates existingBets and members into a series used by UserPointsLineChart
const RoomChart = ({ existingBets = [], members = {}, width = 800 }) => {
  if (!existingBets || !members || members.length === 0) return null;

  const weekSet = new Set();
  existingBets.forEach((b) => {
    if (b && b.week != null) weekSet.add(b.week);
  });
  const weeks = Array.from(weekSet).sort((a, b) => a - b);

  // members may be provided as an object keyed by user_id or as an array of member objects.
  const normalizedMembers = Array.isArray(members)
    ? members
    : Object.entries(members || {}).map(([user_id, m]) => ({
        user_id,
        // support both `name` and `display_name` fields
        display_name: m?.display_name || m?.name || m?.username || m?.email,
        color: m?.color,
      }));

  const series = (normalizedMembers || []).map((m, idx) => {
    const pointsByWeek = {};
    weeks.forEach((w) => (pointsByWeek[w] = 0));

    existingBets.forEach((bet) => {
      if (!bet) return;
      const uid = bet.user_id;
      const wk = bet.week;
      if (uid === m.user_id && wk != null) {
        const pts =
          bet.total_points_earned ?? bet.points_earned ?? bet.points_won ?? 0;
        pointsByWeek[wk] = (pointsByWeek[wk] || 0) + (pts || 0);
      }
    });

    // convert per-week points to cumulative totals so the chart shows running totals
    let running = 0;
    weeks.forEach((w) => {
      running += pointsByWeek[w] || 0;
      pointsByWeek[w] = running;
    });

    const name =
      m.display_name || m.name || m.username || m.email || `User ${m.user_id}`;
    return {
      user_id: m.user_id,
      name,
      color: undefined,
      pointsByWeek,
    };
  });

  const { Title } = Typography;

  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ marginBottom: 8 }}>
        <Title level={4} style={{ margin: 0 }}>
          <Space>
            <TrophyOutlined style={{ color: "#faad14", marginRight: 8 }} />
            Bet History Chart
          </Space>
        </Title>
      </div>
      <UserPointsLineChart
        series={series}
        weeks={weeks}
        width={Math.max(width, weeks.length * 80)}
      />
    </div>
  );
};

export default RoomChart;
