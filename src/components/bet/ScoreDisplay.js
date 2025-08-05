import React from "react";
import { Typography, Space, Tag } from "antd";

const { Text } = Typography;

const ScoreDisplay = ({ bet }) => {
  const gameData = bet?.game_data;

  if (!gameData || !gameData.competitors || gameData.competitors.length === 0) {
    return null;
  }

  const { status, competitors } = gameData;
  const isLive = status?.state === "in";
  const isCompleted = status?.state === "post";
  const isPregame = status?.state === "pre";

  // Don't show scores for pregame
  if (isPregame) {
    return (
      <Space size="small">
        <Tag color="blue">{status?.detail || "Upcoming"}</Tag>
      </Space>
    );
  }

  // Find home and away teams
  const homeTeam = competitors.find((c) => c.homeAway === "home");
  const awayTeam = competitors.find((c) => c.homeAway === "away");

  if (!homeTeam || !awayTeam) {
    return null;
  }

  const getStatusColor = () => {
    if (isLive) return "red";
    if (isCompleted) return "green";
    return "blue";
  };

  const getStatusText = () => {
    if (isLive) return status?.detail || "Live";
    if (isCompleted) return "Final";
    return status?.detail || "Scheduled";
  };

  return (
    <Space direction="vertical" size="small" style={{ width: "100%" }}>
      <Space size="small">
        <Tag color={getStatusColor()}>{getStatusText()}</Tag>
      </Space>
      <Space direction="vertical" size="xs">
        <Space justify="space-between" style={{ width: "100%" }}>
          <Text style={{ fontSize: "12px" }}>{awayTeam.name} (Away)</Text>
          <Text strong style={{ fontSize: "12px" }}>
            {awayTeam.score || 0}
          </Text>
        </Space>
        <Space justify="space-between" style={{ width: "100%" }}>
          <Text style={{ fontSize: "12px" }}>{homeTeam.name} (Home)</Text>
          <Text strong style={{ fontSize: "12px" }}>
            {homeTeam.score || 0}
          </Text>
        </Space>
      </Space>
    </Space>
  );
};

export default ScoreDisplay;
