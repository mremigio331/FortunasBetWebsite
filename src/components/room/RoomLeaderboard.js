import React from "react";
import { Card, Typography, Divider, Row, Col } from "antd";

/**
 * Props:
 * - users: Array<{ name: string, totalPoints: number }>
 */
const RoomLeaderboard = ({ users }) => {
  // Sort users by totalPoints descending
  const sortedUsers = [...users].sort((a, b) => b.totalPoints - a.totalPoints);

  // Calculate places with ties
  let place = 1;
  let lastPoints = null;
  const places = [];
  sortedUsers.forEach((user, idx) => {
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
          {sortedUsers.map((user, idx) => (
            <tr key={user.name}>
              <td style={{ padding: "6px 0" }}>
                {places[idx].tied
                  ? `Tied for ${places[idx].place}`
                  : places[idx].place}
              </td>
              <td style={{ padding: "6px 0" }}>{user.name}</td>
              <td style={{ padding: "6px 0" }}>{user.totalPoints}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
};

export default RoomLeaderboard;
