import React from "react";
import { Typography, Tag, Button, Radio, Tooltip } from "antd";

const { Text } = Typography;

const BettingControls = ({
  game,
  bet,
  hasValidSpread,
  homeLine,
  awayLine,
  onBetTypeChange,
  onTeamChoiceChange,
  onPointsChange,
  roomSport,
  sportRules,
  weeklyTakenPoints,
  duplicatePointValues,
  sessionPointCounts,
}) => {
  const fmtLine = (n) =>
    n === null || n === undefined
      ? ""
      : n > 0
        ? `+${n.toFixed(1)}`
        : n.toFixed(1);

  const handleTeamChange = (val) => {
    if (bet.betType === "spread") {
      const takenLine = val === "home" ? homeLine : awayLine;
      onTeamChoiceChange(game.game_id, { teamChoice: val, takenLine });
    } else {
      onTeamChoiceChange(game.game_id, { overUnderChoice: val });
    }
  };

  return (
    <div
      style={{
        marginTop: 16,
        padding: 12,
        backgroundColor: "#f6ffed",
        borderRadius: 6,
        border: "1px solid #b7eb8f",
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <Text strong style={{ fontSize: 12, color: "#389e0d" }}>
        Betting Options:
      </Text>

      {/* Bet Type Selection */}
      <div style={{ marginTop: 8, marginBottom: 12 }}>
        <Radio.Group
          value={bet.betType}
          onChange={(e) => onBetTypeChange(game.game_id, e.target.value)}
          size="small"
        >
          <Radio.Button value="spread" disabled={!hasValidSpread}>
            Spread
          </Radio.Button>
          <Radio.Button value="overUnder" disabled={!game.overUnder}>
            Total
          </Radio.Button>
        </Radio.Group>
      </div>

      {/* Team/Option Selection */}
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 11, marginBottom: 4, color: "#666" }}>
          Choose {bet.betType === "spread" ? "team" : "option"}:
        </div>
        <Radio.Group
          value={
            bet.betType === "spread"
              ? (bet.teamChoice ?? null)
              : (bet.overUnderChoice ?? null)
          }
          onChange={(e) => handleTeamChange(e.target.value)}
          size="small"
          style={{ width: "100%" }}
        >
          {bet.betType === "spread" ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <Radio value="away" style={{ fontSize: 11 }}>
                {`${game.teams.away?.abbreviation || "Away"} ${fmtLine(awayLine)}`}
                {game.favoredTeam === "away" && (
                  <Tag color="green" size="small" style={{ marginLeft: 6 }}>
                    FAV
                  </Tag>
                )}
              </Radio>
              <Radio value="home" style={{ fontSize: 11 }}>
                {`${game.teams.home?.abbreviation || "Home"} ${fmtLine(homeLine)}`}
                {game.favoredTeam === "home" && (
                  <Tag color="green" size="small" style={{ marginLeft: 6 }}>
                    FAV
                  </Tag>
                )}
              </Radio>
            </div>
          ) : (
            <div style={{ display: "flex", gap: 8 }}>
              <Radio value="over">Over</Radio>
              <Radio value="under">Under</Radio>
            </div>
          )}
        </Radio.Group>
      </div>

      {/* Points Selection */}
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <Text style={{ fontSize: 11, color: "#666" }}>Points:</Text>
        <div style={{ display: "flex", gap: 4 }}>
          {(sportRules?.allowedPoints || [1, 2, 3]).map((points) => {
            const isCurrent = bet.points === points;
            const pointLimit = sportRules?.pointLimits?.[points] ?? 1;
            const weeklyUsedCount =
              weeklyTakenPoints?.filter((p) => p === points).length ?? 0;

            let disabled = false;
            let title = "";

            if (sportRules?.uniquePointsPerBet) {
              const isWeeklyTaken = weeklyTakenPoints?.includes(points);
              const isSessionDup =
                !isWeeklyTaken && duplicatePointValues?.includes(points);
              disabled = !isCurrent && (isWeeklyTaken || isSessionDup);
              if (isWeeklyTaken)
                title = `${points} point${points !== 1 ? "s" : ""} already used this week`;
              else if (isSessionDup)
                title = `${points} point${points !== 1 ? "s" : ""} already selected in another bet`;
            } else {
              const sessionCount = sessionPointCounts[points] || 0;
              const sessionCountExcludingSelf = isCurrent
                ? sessionCount - 1
                : sessionCount;
              const atLimit =
                weeklyUsedCount + sessionCountExcludingSelf >= pointLimit;
              disabled = !isCurrent && atLimit;
              if (disabled)
                title = `Maximum ${pointLimit} bet${pointLimit !== 1 ? "s" : ""} at ${points} point${points !== 1 ? "s" : ""} per week`;
            }

            const label = sportRules?.pointLabels?.[points] ?? points;
            const isBigBet = roomSport === "MLB" && points === 6;

            const btn = (
              <Button
                key={points}
                size="small"
                type={isCurrent ? "primary" : "default"}
                disabled={disabled}
                onClick={() => onPointsChange(game.game_id, points)}
                style={{
                  minWidth: isBigBet ? 64 : 32,
                  height: 24,
                  fontSize: 11,
                  padding: "0 6px",
                  opacity: disabled ? 0.5 : 1,
                  ...(isBigBet && !isCurrent
                    ? {
                        borderColor: "#faad14",
                        color: "#d48806",
                        fontWeight: 600,
                      }
                    : {}),
                  ...(isBigBet && isCurrent
                    ? {
                        backgroundColor: "#faad14",
                        borderColor: "#faad14",
                        fontWeight: 600,
                      }
                    : {}),
                }}
              >
                {isBigBet ? "\u2605 Big Bet" : label}
              </Button>
            );

            const tooltipTitle = disabled
              ? title
              : isBigBet
                ? "6 points \u2014 1 per week"
                : "";

            return tooltipTitle ? (
              <Tooltip key={points} title={tooltipTitle}>
                {btn}
              </Tooltip>
            ) : (
              btn
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default BettingControls;
