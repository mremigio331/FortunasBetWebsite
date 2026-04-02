import React from "react";
import { Card, Typography, Divider, Avatar } from "antd";
import LoadingSpinner from "../shared/LoadingSpinner";
import { TrophyOutlined } from "@ant-design/icons";
import { getAvatarStyle } from "../../utils/avatarStyles";
import { computeUserStats } from "../../utils/betUtils";

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
        <LoadingSpinner message="Calculating leaderboard..." />
      </Card>
    );
  }

  const usersMap = Object.fromEntries(
    members.filter((m) => m.status === "approved").map((m) => [m.user_id, m]),
  );
  const stats = computeUserStats(bets, usersMap);

  // Include approved members who have no bets (computeUserStats only
  // returns entries for users present in the bets array).
  const statsUserIds = new Set(stats.map((s) => s.user_id));
  const membersWithNoBets = Object.values(usersMap)
    .filter((m) => !statsUserIds.has(m.user_id))
    .map((m) => ({
      name: m.user_name || m.user_id,
      color: m.user_color,
      totalPoints: 0,
    }));

  const leaderboard = [
    ...stats.map((s) => ({
      name: s.user_name,
      color: s.user_color,
      totalPoints: s.points_total,
    })),
    ...membersWithNoBets,
  ];

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
