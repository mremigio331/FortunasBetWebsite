import React from "react";
import { Card, Typography, Divider, Spin, Avatar } from "antd";
import { TrophyOutlined } from "@ant-design/icons";
import { getAvatarStyle } from "../../utils/avatarStyles";

/**
 * RoomLeaderboard
 *
 * Props:
 * - isBetsLoading: boolean - loading state for bets
 * - bets: Array<bet> - array of bet objects
 * - members: Array<member> - array of member objects
 *
 * Displays a leaderboard table of users and their total points, with place and avatar.
 */
const RoomLeaderboard = ({ isBetsLoading, bets = [], members = [] }) => {
  if (isBetsLoading) {
    return (
      <Card
        title={
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span role="img" aria-label="trophy" style={{ color: "#faad14" }}>
              🏆
            </span>
            Leaderboard
          </div>
        }
        style={{ marginBottom: "2rem", boxShadow: "0 2px 8px #f0f1f2" }}
      >
        <div style={{ textAlign: "center", padding: "40px" }}>
          <Spin size="large" />
          <div style={{ marginTop: "16px" }}>
            <Typography.Text>Calculating leaderboard...</Typography.Text>
          </div>
        </div>
      </Card>
    );
  }

  const userPointsMap = {};
  bets.forEach((bet) => {
    const userId = bet.user_id;
    let points = 0;
    if (typeof bet.total_points_earned === "number") {
      points = bet.total_points_earned;
    } else if (bet.game_bet && typeof bet.game_bet.points_earned === "number") {
      points = bet.game_bet.points_earned;
    }
    if (!userPointsMap[userId]) {
      userPointsMap[userId] = 0;
    }
    userPointsMap[userId] += points;
  });

  const leaderboard = members
    .filter((m) => m.status === "approved")
    .map((m) => ({
      name: m.user_name || m.user_id,
      color: m.user_color,
      totalPoints: userPointsMap[m.user_id] || 0,
    }))
    .sort((a, b) => b.totalPoints - a.totalPoints);

  let place = 1;
  let lastPoints = null;
  const places = [];
  leaderboard.forEach((user, idx) => {
    if (lastPoints === null || user.totalPoints !== lastPoints) {
      place = idx + 1;
      places.push({ place, tied: false });
    } else {
      places.push({ place, tied: true });
    }
    lastPoints = user.totalPoints;
  });

  return (
    <Card
      title={
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span role="img" aria-label="trophy" style={{ color: "#faad14" }}>
            🏆
          </span>
          Leaderboard
        </div>
      }
      style={{ marginBottom: "2rem", boxShadow: "0 2px 8px #f0f1f2" }}
    >
      <Divider style={{ margin: "8px 0 16px 0" }} />
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th style={{ textAlign: "left", padding: "20px 0" }}>Place</th>
            <th style={{ textAlign: "left", padding: "20px 0" }}></th>
            <th style={{ textAlign: "left", padding: "20px 0" }}>User</th>
            <th style={{ textAlign: "left", padding: "20px 0" }}>
              Total Points
            </th>
          </tr>
        </thead>
        <tbody>
          {leaderboard.map((user, idx) => (
            <tr key={user.name} style={{ marginBottom: "10px" }}>
              <td style={{ padding: "18px 0" }}>
                {places[idx].tied
                  ? `Tied for ${places[idx].place}`
                  : places[idx].place}
              </td>
              <td style={{ padding: "18px 0" }}>
                <Avatar
                  size="small"
                  style={{
                    ...getAvatarStyle(user.color),
                    verticalAlign: "middle",
                  }}
                >
                  {user.name.charAt(0).toUpperCase()}
                </Avatar>
              </td>
              <td
                style={{
                  padding: "18px 0",
                  wordBreak: "break-word",
                }}
              >
                {user.name}
              </td>
              <td style={{ padding: "18px 0" }}>{user.totalPoints}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
};

export default RoomLeaderboard;
