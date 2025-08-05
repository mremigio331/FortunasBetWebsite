import React from "react";
import { Typography, Space, Tag } from "antd";

const { Text } = Typography;

const ScoreDisplay = ({ bet, isCompact = false, showBetResult = false }) => {
  // Debug logging
  console.log("ScoreDisplay received bet:", bet);
  console.log("ScoreDisplay game_status:", bet?.game_status);

  // Use the game_status data that comes directly from the bet API response
  const gameStatus = bet.game_status;

  // Don't show anything if we don't have game status data
  if (!gameStatus || !gameStatus.home_team || !gameStatus.away_team) {
    console.log("ScoreDisplay: No game status data, returning null");
    return null;
  }

  console.log("ScoreDisplay: Game status found, rendering scores");
  const { status, home_team, away_team } = gameStatus;
  const isLive = status.state === "in";
  const isCompleted = status.state === "post" || status.completed;
  const isPregame = status.state === "pre";

  // Don't show scores for pregame
  if (isPregame) {
    return null;
  }

  const totalScore = (away_team.score || 0) + (home_team.score || 0);

  const getStatusText = () => {
    if (isLive) return "LIVE";
    if (isCompleted) return "FINAL";
    return status.detail || "";
  };

  const getStatusColor = () => {
    if (isLive) return "#ff4d4f"; // Red for live
    if (isCompleted) return "#52c41a"; // Green for final
    return "#1890ff"; // Blue default
  };

  // Calculate bet result context for display
  const getBetResultContext = () => {
    if (!showBetResult || !bet.game_bet || !isCompleted) return null;

    if (bet.game_bet.bet_type === "over_under") {
      const line = bet.game_bet.total_value;
      const choice = bet.game_bet.over_under_choice;
      if (line && choice) {
        const result =
          choice.toLowerCase() === "over"
            ? totalScore > line
            : totalScore < line;
        return {
          text: `${choice.toUpperCase()} ${line} → ${result ? "WIN" : "LOSS"}`,
          color: result ? "#52c41a" : "#ff4d4f",
        };
      }
    } else if (bet.game_bet.bet_type === "spread") {
      const spread = bet.game_bet.spread_value;
      const teamChoice = bet.game_bet.team_choice;
      if (spread && teamChoice) {
        const selectedScore =
          teamChoice.toLowerCase() === "home"
            ? home_team.score
            : away_team.score;
        const opponentScore =
          teamChoice.toLowerCase() === "home"
            ? away_team.score
            : home_team.score;
        const margin = selectedScore - opponentScore;
        const result = margin > spread;
        return {
          text: `${teamChoice.toUpperCase()} ${spread > 0 ? "+" : ""}${spread} → ${result ? "WIN" : "LOSS"}`,
          color: result ? "#52c41a" : "#ff4d4f",
        };
      }
    }
    return null;
  };

  const betResult = getBetResultContext();

  if (isCompact) {
    // Compact version for smaller cards
    return (
      <div style={{ fontSize: "12px", color: "#595959", marginTop: "4px" }}>
        <Space direction="vertical" size={2} style={{ width: "100%" }}>
          <Space size={4}>
            <Text style={{ fontSize: "12px", fontWeight: "500" }}>
              {away_team.short_name}: {away_team.score || 0}
            </Text>
            <Text style={{ fontSize: "12px", color: "#8c8c8c" }}>-</Text>
            <Text style={{ fontSize: "12px", fontWeight: "500" }}>
              {home_team.short_name}: {home_team.score || 0}
            </Text>
            {(isLive || isCompleted) && (
              <Tag
                color={getStatusColor()}
                size="small"
                style={{ fontSize: "10px", lineHeight: "14px" }}
              >
                {getStatusText()}
              </Tag>
            )}
          </Space>

          {/* Show bet result context if available */}
          {betResult && (
            <Text
              style={{
                fontSize: "11px",
                color: betResult.color,
                fontWeight: "500",
              }}
            >
              {betResult.text}
            </Text>
          )}

          {/* Show total for over/under bets */}
          {bet.game_bet?.bet_type === "over_under" && (
            <Text style={{ fontSize: "11px", color: "#8c8c8c" }}>
              Total: {totalScore}
              {bet.game_bet.total_value && ` (O/U ${bet.game_bet.total_value})`}
            </Text>
          )}
        </Space>
      </div>
    );
  }

  // Full version for larger displays
  return (
    <div style={{ marginTop: "8px" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "8px 12px",
          backgroundColor: "#f5f5f5",
          borderRadius: "6px",
          border: "1px solid #d9d9d9",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            width: "100%",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Text style={{ fontSize: "13px", fontWeight: "500" }}>
              {away_team.short_name}
            </Text>
            <Text
              style={{
                fontSize: "16px",
                fontWeight: "700",
                color: "#262626",
              }}
            >
              {away_team.score || 0}
            </Text>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Text
              style={{
                fontSize: "16px",
                fontWeight: "700",
                color: "#262626",
              }}
            >
              {home_team.score || 0}
            </Text>
            <Text style={{ fontSize: "13px", fontWeight: "500" }}>
              {home_team.short_name}
            </Text>
          </div>
        </div>

        {(isLive || isCompleted) && (
          <Tag
            color={getStatusColor()}
            size="small"
            style={{
              marginLeft: "12px",
              fontSize: "11px",
              fontWeight: "500",
            }}
          >
            {getStatusText()}
          </Tag>
        )}
      </div>

      {/* Show total score for over/under bets */}
      {bet.game_bet?.bet_type === "over_under" && (
        <div
          style={{
            textAlign: "center",
            marginTop: "4px",
            fontSize: "12px",
            color: "#595959",
          }}
        >
          <Text style={{ fontSize: "12px" }}>
            Total: {(away_team.score || 0) + (home_team.score || 0)}
            {bet.game_bet.total_value && (
              <span style={{ color: "#8c8c8c" }}>
                {" "}
                (O/U {bet.game_bet.total_value})
              </span>
            )}
          </Text>
        </div>
      )}

      {/* Show spread info for spread bets */}
      {bet.game_bet?.bet_type === "spread" && bet.game_bet.spread_value && (
        <div
          style={{
            textAlign: "center",
            marginTop: "4px",
            fontSize: "12px",
            color: "#595959",
          }}
        >
          <Text style={{ fontSize: "12px" }}>
            Spread: {bet.game_bet.team_choice?.toUpperCase()}{" "}
            {bet.game_bet.spread_value > 0 ? "+" : ""}
            {bet.game_bet.spread_value}
          </Text>
        </div>
      )}

      {/* Show bet result if available */}
      {betResult && (
        <div
          style={{
            textAlign: "center",
            marginTop: "4px",
            fontSize: "12px",
          }}
        >
          <Text
            style={{
              fontSize: "12px",
              color: betResult.color,
              fontWeight: "500",
            }}
          >
            {betResult.text}
          </Text>
        </div>
      )}
    </div>
  );
};

export default ScoreDisplay;
