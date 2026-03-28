import React from "react";
import { Typography, Space, Tag } from "antd";

const { Text } = Typography;

/**
 * Normalizes either game_status or game_data into a common shape.
 * Returns null if neither is present.
 */
function normalizeScoreData(bet) {
  const gameStatus = bet?.game_status;
  const gameData = bet?.game_data;
  const oddsSnapshot = bet?.odds_snapshot;

  if (gameStatus && gameStatus.home_team && gameStatus.away_team) {
    return {
      homeTeam: gameStatus.home_team.short_name,
      awayTeam: gameStatus.away_team.short_name,
      homeScore: gameStatus.home_team.score || 0,
      awayScore: gameStatus.away_team.score || 0,
      gameState: gameStatus.status?.completed
        ? "post"
        : gameStatus.status?.state || "pre",
      detail: gameStatus.status?.detail || "",
    };
  }

  if (gameData && gameData.competitors && gameData.competitors.length > 0) {
    const homeTeam = gameData.competitors.find((c) => c.homeAway === "home");
    const awayTeam = gameData.competitors.find((c) => c.homeAway === "away");
    if (!homeTeam || !awayTeam) return null;

    return {
      homeTeam: homeTeam.name,
      awayTeam: awayTeam.name,
      homeScore: homeTeam.score || 0,
      awayScore: awayTeam.score || 0,
      gameState: gameData.status?.state || "pre",
      detail: gameData.status?.detail || "",
    };
  }

  // Handle odds_snapshot shape (teams.home/away with abbreviation, status.home_score/away_score)
  if (oddsSnapshot && oddsSnapshot.teams?.home && oddsSnapshot.teams?.away) {
    const state = oddsSnapshot.status?.completed
      ? "post"
      : oddsSnapshot.status?.state || "pre";
    return {
      homeTeam:
        oddsSnapshot.teams.home.abbreviation ||
        oddsSnapshot.teams.home.name ||
        "Home",
      awayTeam:
        oddsSnapshot.teams.away.abbreviation ||
        oddsSnapshot.teams.away.name ||
        "Away",
      homeScore:
        oddsSnapshot.status?.home_score || oddsSnapshot.teams.home.score || 0,
      awayScore:
        oddsSnapshot.status?.away_score || oddsSnapshot.teams.away.score || 0,
      gameState: state,
      detail: oddsSnapshot.status?.detail || "",
    };
  }

  return null;
}

const ScoreDisplay = ({ bet, mode = "full", showBetResult = false }) => {
  const normalized = normalizeScoreData(bet);
  if (!normalized) return null;

  const { homeTeam, awayTeam, homeScore, awayScore, gameState, detail } =
    normalized;

  const isLive = gameState === "in";
  const isCompleted = gameState === "post";
  const isPregame = gameState === "pre";

  // Don't show scores for pregame
  if (isPregame) {
    if (detail) {
      return (
        <Space size="small">
          <Tag color="blue">{detail || "Upcoming"}</Tag>
        </Space>
      );
    }
    return null;
  }

  const totalScore = awayScore + homeScore;

  const getStatusText = () => {
    if (isLive) return "LIVE";
    if (isCompleted) return "FINAL";
    return detail || "";
  };

  const getStatusColor = () => {
    if (isLive) return "#ff4d4f";
    if (isCompleted) return "#52c41a";
    return "#1890ff";
  };

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
          teamChoice.toLowerCase() === "home" ? homeScore : awayScore;
        const opponentScore =
          teamChoice.toLowerCase() === "home" ? awayScore : homeScore;
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

  if (mode === "compact") {
    return (
      <div style={{ fontSize: "12px", color: "#595959", marginTop: "4px" }}>
        <Space direction="vertical" size={2} style={{ width: "100%" }}>
          <Space size={4}>
            <Text style={{ fontSize: "12px", fontWeight: "500" }}>
              {awayTeam}: {awayScore}
            </Text>
            <Text style={{ fontSize: "12px", color: "#8c8c8c" }}>-</Text>
            <Text style={{ fontSize: "12px", fontWeight: "500" }}>
              {homeTeam}: {homeScore}
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

  // Full mode
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
              {awayTeam}
            </Text>
            <Text
              style={{
                fontSize: "16px",
                fontWeight: "700",
                color: "#262626",
              }}
            >
              {awayScore}
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
              {homeScore}
            </Text>
            <Text style={{ fontSize: "13px", fontWeight: "500" }}>
              {homeTeam}
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
            Total: {totalScore}
            {bet.game_bet.total_value && (
              <span style={{ color: "#8c8c8c" }}>
                {" "}
                (O/U {bet.game_bet.total_value})
              </span>
            )}
          </Text>
        </div>
      )}

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

export { normalizeScoreData };
export default ScoreDisplay;
