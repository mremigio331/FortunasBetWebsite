import React from "react";
import { Card, Divider, Avatar, Tag } from "antd";
import LoadingSpinner from "../shared/LoadingSpinner";
import { TrophyOutlined } from "@ant-design/icons";
import { getAvatarStyle } from "../../utils/avatarStyles";

/**
 * RoomLeaderboard
 *
 * Props:
 * - isLoading: boolean - loading state for leaderboard
 * - leaderboard: Array<{ user_id, user_name, user_color, total_points_earned, wins, losses, pushes, total_bets, win_rate }>
 * - clinch: server clinch status from GET /room/{room_id}/clinch, or null.
 *   { standings: [{ user_id, max_possible, clinched_place }],
 *     room_complete, winner_user_ids, weeks_remaining }
 *
 * Displays a leaderboard table of users and their total points, with place and avatar.
 * Data is now server-computed via GET /room/{room_id}/leaderboard.
 */
const ordinal = (n) => {
  const rem100 = n % 100;
  if (rem100 >= 11 && rem100 <= 13) return `${n}th`;
  const suffix = { 1: "st", 2: "nd", 3: "rd" }[n % 10] || "th";
  return `${n}${suffix}`;
};

/** Status tags for one member: Winner, or Clinched <place>. */
const ClinchTags = ({ status, isWinner }) => {
  if (!status) return null;
  return (
    <>
      {isWinner && <Tag color="green">🏆 Winner</Tag>}
      {!isWinner && status.clinched_place != null && (
        <Tag color={status.clinched_place === 1 ? "gold" : "blue"}>
          Clinched {ordinal(status.clinched_place)}
        </Tag>
      )}
    </>
  );
};

const RoomLeaderboard = ({
  isLoading,
  leaderboard: leaderboardData = [],
  clinch = null,
}) => {
  if (isLoading) {
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

  const clinchByUser = {};
  (clinch?.standings || []).forEach((s) => {
    clinchByUser[s.user_id] = s;
  });
  const winnerIds = new Set(clinch?.winner_user_ids || []);
  const weeksRemaining = clinch?.weeks_remaining;

  const leaderboard = leaderboardData.map((entry) => ({
    userId: entry.user_id,
    name: entry.user_name,
    color: entry.user_color,
    totalPoints: entry.total_points_earned,
  }));

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
      {clinch && !clinch.room_complete && weeksRemaining > 0 && (
        <div style={{ marginBottom: 8, fontSize: 12, color: "#8c8c8c" }}>
          {weeksRemaining} {weeksRemaining === 1 ? "week" : "weeks"} left
        </div>
      )}
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th style={{ textAlign: "left", padding: "20px 0" }}>Place</th>
            <th style={{ textAlign: "left", padding: "20px 0" }}></th>
            <th style={{ textAlign: "left", padding: "20px 0" }}>User</th>
            <th style={{ textAlign: "left", padding: "20px 0" }}>
              Total Points
            </th>
            {clinch && (
              <th style={{ textAlign: "left", padding: "20px 0" }}>
                Max Possible
              </th>
            )}
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
                {user.name}{" "}
                <ClinchTags
                  status={clinchByUser[user.userId]}
                  isWinner={winnerIds.has(user.userId)}
                />
              </td>
              <td style={{ padding: "18px 0" }}>{user.totalPoints}</td>
              {clinch && (
                <td style={{ padding: "18px 0" }}>
                  {clinchByUser[user.userId]?.max_possible ?? ""}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
};

export default RoomLeaderboard;
