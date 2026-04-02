import React from "react";
import { Typography } from "antd";
import { getSeasonTypeDisplayName } from "../../configs/nflSeasonTypes";

const { Text } = Typography;

const StatusMessages = ({
  oddsCount,
  selectedWeek,
  selectedYear,
  selectedSeasonType,
  selectedBetsCount,
  hasDuplicatePoints,
  roomSport = "NFL",
  sportRules,
  weeklyTakenPoints = [],
  sessionPointCounts = {},
}) => {
  const maxBets = sportRules?.maxBetsPerWeek ?? 3;
  const pointsDisplay = sportRules?.allowedPoints?.join(", ") ?? "1, 2, or 3";
  const existingBetCount = weeklyTakenPoints.length;
  const totalBetsUsed = selectedBetsCount + existingBetCount;
  const remainingSlots = Math.max(0, maxBets - totalBetsUsed);

  // Build per-point remaining info for MLB
  const pointRemainingInfo = !sportRules?.uniquePointsPerBet
    ? (sportRules?.allowedPoints || []).map((pt) => {
        const weeklyUsed = weeklyTakenPoints.filter((p) => p === pt).length;
        const sessionUsed = sessionPointCounts[pt] || 0;
        const limit = sportRules?.pointLimits?.[pt] ?? 0;
        const remaining = Math.max(0, limit - weeklyUsed - sessionUsed);
        const label = sportRules?.pointLabels?.[pt] ?? pt;
        return { pt, label, remaining, limit };
      })
    : [];

  return (
    <div style={{ marginBottom: "16px" }}>
      <Text strong>
        Found {oddsCount} games for{" "}
        {getSeasonTypeDisplayName(selectedSeasonType)} Week {selectedWeek},{" "}
        {selectedYear}
      </Text>
      {totalBetsUsed < maxBets && (
        <div style={{ marginTop: "4px" }}>
          <Text type="secondary" style={{ fontSize: "12px" }}>
            Click on games to select them for betting.{" "}
            {existingBetCount > 0
              ? `You have ${existingBetCount} existing bet${existingBetCount !== 1 ? "s" : ""} this week. ${remainingSlots} slot${remainingSlots !== 1 ? "s" : ""} remaining.`
              : `You can select up to ${maxBets} games.`}
          </Text>
        </div>
      )}
      {!sportRules?.uniquePointsPerBet && totalBetsUsed < maxBets && (
        <div style={{ marginTop: "4px" }}>
          <Text type="secondary" style={{ fontSize: "12px" }}>
            {pointRemainingInfo
              .map(
                (info) => `${info.label}: ${info.remaining}/${info.limit} left`,
              )
              .join(" · ")}
          </Text>
        </div>
      )}
      {hasDuplicatePoints && (
        <div style={{ marginTop: "4px" }}>
          <Text type="danger" style={{ fontSize: "12px" }}>
            {sportRules?.uniquePointsPerBet
              ? `⚠️ Each bet must have a unique point value (${pointsDisplay}). Please adjust your selections.`
              : `⚠️ You've exceeded the allowed limits. MLB allows max ${maxBets} bets: up to ${sportRules?.pointLimits?.[1] ?? 4} at 1pt and ${sportRules?.pointLimits?.[6] ?? 1} at 6pt. Please adjust your selections.`}
          </Text>
        </div>
      )}
      {totalBetsUsed >= maxBets &&
        !hasDuplicatePoints &&
        selectedBetsCount > 0 && (
          <div style={{ marginTop: "4px" }}>
            <Text type="success" style={{ fontSize: "12px" }}>
              ✓ All {maxBets} bet slots filled! Ready to submit bets.
            </Text>
          </div>
        )}
    </div>
  );
};

export default StatusMessages;
