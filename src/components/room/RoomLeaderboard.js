import React from "react";
import { Card, Typography, Divider, Row, Col, Avatar } from "antd";

/**
 * Props:
 * - bets: Array<bet>
 * - members: Array<member>
 */
const RoomLeaderboard = ({ bets = [], members = [] }) => {
  // Map user_id to member info
  const memberMap = {};
  members.forEach((m) => {
    memberMap[m.user_id] = m;
  });

  // Calculate total points for each user
  const userPointsMap = {};
  bets.forEach((bet) => {
    const userId = bet.user_id;
    // Only count points that are actually earned (not null)
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

  // Build leaderboard array from members (approved only)
  const leaderboard = members
    .filter((m) => m.status === "approved")
    .map((m) => ({
      name: m.user_name || m.user_id,
      color: m.user_color,
      totalPoints: userPointsMap[m.user_id] || 0,
    }))
    .sort((a, b) => b.totalPoints - a.totalPoints);

  // Calculate places with ties
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
    <Card style={{ marginBottom: "2rem", boxShadow: "0 2px 8px #f0f1f2" }}>
      <Row align="middle" justify="space-between" style={{ marginBottom: 8 }}>
        <Col>
          <Typography.Title level={4} style={{ margin: 0 }}>
            Leaderboard
          </Typography.Title>
        </Col>
      </Row>
      <Divider style={{ margin: "8px 0 16px 0" }} />
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th style={{ textAlign: "left", padding: "8px 0" }}>Place</th>
            <th style={{ textAlign: "left", padding: "8px 0" }}>User</th>
            <th style={{ textAlign: "left", padding: "8px 0" }}>
              Total Points
            </th>
          </tr>
        </thead>
        <tbody>
          {leaderboard.map((user, idx) => (
            <tr key={user.name}>
              <td style={{ padding: "6px 0" }}>
                {places[idx].tied
                  ? `Tied for ${places[idx].place}`
                  : places[idx].place}
              </td>
              <td
                style={{
                  padding: "6px 0",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <Avatar
                  size="small"
                  style={{
                    backgroundColor: user.color || "#1890ff",
                    verticalAlign: "middle",
                  }}
                >
                  {user.name.charAt(0).toUpperCase()}
                </Avatar>
                {user.name}
              </td>
              <td style={{ padding: "6px 0" }}>{user.totalPoints}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
};

export default RoomLeaderboard;
