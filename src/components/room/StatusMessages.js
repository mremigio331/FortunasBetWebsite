import React from "react";
import { Typography } from "antd";
import { getSeasonTypeDisplayName } from "../../config/nflSeasonTypes";

const { Text } = Typography;

const StatusMessages = ({
  oddsCount,
  selectedWeek,
  selectedYear,
  selectedSeasonType,
  selectedBetsCount,
  hasDuplicatePoints,
}) => {
  return (
    <div style={{ marginBottom: "16px" }}>
      <Text strong>
        Found {oddsCount} games for{" "}
        {getSeasonTypeDisplayName(selectedSeasonType)} Week {selectedWeek},{" "}
        {selectedYear}
      </Text>
      {selectedBetsCount < 3 && (
        <div style={{ marginTop: "4px" }}>
          <Text type="secondary" style={{ fontSize: "12px" }}>
            Click on games to select them for betting. You can select up to 3
            games.
          </Text>
        </div>
      )}
      {hasDuplicatePoints && (
        <div style={{ marginTop: "4px" }}>
          <Text type="danger" style={{ fontSize: "12px" }}>
            ⚠️ Each bet must have a unique point value (1, 2, or 3). Please
            adjust your selections.
          </Text>
        </div>
      )}
      {selectedBetsCount === 3 && !hasDuplicatePoints && (
        <div style={{ marginTop: "4px" }}>
          <Text type="success" style={{ fontSize: "12px" }}>
            ✓ All 3 games selected! Ready to submit bets.
          </Text>
        </div>
      )}
    </div>
  );
};

export default StatusMessages;
