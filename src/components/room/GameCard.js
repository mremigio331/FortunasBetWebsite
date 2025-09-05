import React from "react";
import {
  Card,
  Typography,
  Tag,
  Button,
  Divider,
  Radio,
  InputNumber,
  Image,
  Tooltip,
} from "antd";
import { CheckCircleOutlined } from "@ant-design/icons";

const { Text } = Typography;

const GameCard = ({
  game,
  isSelected,
  bet,
  canSelect,
  hasConflictingPoints,
  duplicatePointValues,
  weeklyTakenPoints,
  onGameSelect,
  onBetTypeChange,
  onTeamChoiceChange,
  onPointsChange,
}) => {
  // Helper function to get overall record
  const getOverallRecord = (records) => {
    const overallRecord = records?.find(
      (record) => record.name === "overall" || record.type === "total",
    );
    return overallRecord?.summary || "";
  };

  // Disable selection for live/completed games or games without spread
  const hasValidSpread =
    game.spread !== null && game.spread !== undefined && game.spreadDetails;
  const isGameSelectable =
    canSelect && game.status && game.status.state === "pre" && hasValidSpread;

  return (
    <Card
      size="small"
      style={{
        border: hasConflictingPoints
          ? "2px solid #ff4d4f"
          : isSelected
            ? "2px solid #1890ff"
            : "1px solid #f0f0f0",
        borderRadius: "8px",
        height: "100%",
        cursor: isGameSelectable ? "pointer" : "not-allowed",
        boxShadow: hasConflictingPoints
          ? "0 4px 12px rgba(255, 77, 79, 0.15)"
          : isSelected
            ? "0 4px 12px rgba(24, 144, 255, 0.15)"
            : undefined,
        opacity: isGameSelectable ? 1 : 0.6,
        filter: isGameSelectable ? "none" : "grayscale(30%)",
      }}
      bodyStyle={{ padding: "16px" }}
      onClick={() => isGameSelectable && onGameSelect(game.game_id)}
      hoverable={isGameSelectable}
    >
      {/* Selection Indicator */}
      {isSelected && (
        <div
          style={{
            position: "absolute",
            top: "8px",
            right: "8px",
            zIndex: 1,
          }}
        >
          <CheckCircleOutlined
            style={{
              color: hasConflictingPoints ? "#ff4d4f" : "#1890ff",
              fontSize: "20px",
              backgroundColor: "white",
              borderRadius: "50%",
            }}
          />
        </div>
      )}

      {/* Conflict Warning */}
      {hasConflictingPoints && (
        <div
          style={{
            position: "absolute",
            top: "8px",
            left: "8px",
            zIndex: 1,
            backgroundColor: "#ff4d4f",
            color: "white",
            padding: "2px 6px",
            borderRadius: "4px",
            fontSize: "10px",
            fontWeight: "600",
          }}
        >
          {weeklyTakenPoints?.includes(bet.points)
            ? "USED THIS WEEK"
            : "DUPLICATE"}
        </div>
      )}

      {/* Game Header */}
      <div style={{ textAlign: "center", marginBottom: "12px" }}>
        <Text strong style={{ fontSize: "14px" }}>
          {new Date(game.date).toLocaleDateString("en-US", {
            weekday: "short",
            month: "short",
            day: "numeric",
            hour: "numeric",
            minute: "2-digit",
          })}
        </Text>

        {/* Venue Information */}
        {game.venue && (game.venue.name || game.venue.city) && (
          <div
            style={{
              fontSize: "10px",
              color: "#666",
              marginTop: "2px",
              fontStyle: "italic",
            }}
          >
            {game.venue.name && game.venue.city
              ? `${game.venue.name}, ${game.venue.city}${game.venue.state ? `, ${game.venue.state}` : ""}`
              : game.venue.name ||
                `${game.venue.city}${game.venue.state ? `, ${game.venue.state}` : ""}`}
            {game.venue.indoor && (
              <span
                style={{
                  marginLeft: "4px",
                  fontSize: "9px",
                  backgroundColor: "#e6f7ff",
                  color: "#1890ff",
                  padding: "1px 3px",
                  borderRadius: "2px",
                }}
              >
                INDOOR
              </span>
            )}
          </div>
        )}

        {/* Game Status and Live Info */}
        {game.status && (
          <div style={{ marginTop: "4px" }}>
            {game.status.state === "in" ? (
              // Live game - show quarter and clock
              <div
                style={{
                  fontSize: "12px",
                  color: "#ff4d4f",
                  fontWeight: "600",
                  backgroundColor: "#fff2f0",
                  padding: "2px 6px",
                  borderRadius: "4px",
                  display: "inline-block",
                }}
              >
                🔴 LIVE - Q{game.status.period} {game.status.displayClock}
              </div>
            ) : game.status.state === "post" ? (
              // Completed game
              <div
                style={{
                  fontSize: "12px",
                  color: "#52c41a",
                  fontWeight: "600",
                  backgroundColor: "#f6ffed",
                  padding: "2px 6px",
                  borderRadius: "4px",
                  display: "inline-block",
                }}
              >
                ✅ {game.status.shortDetail || "FINAL"}
              </div>
            ) : (
              // Pre-game
              <div
                style={{
                  fontSize: "11px",
                  color: "#666",
                  marginTop: "2px",
                }}
              >
                {game.status.shortDetail || "Scheduled"}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Teams */}
      <div style={{ marginBottom: "16px" }}>
        {/* Away Team */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "8px",
            padding: "8px",
            backgroundColor: "#fafafa",
            borderRadius: "4px",
            position: "relative",
          }}
        >
          {/* Winner indicator for completed games */}
          {game.status &&
            game.status.state === "post" &&
            game.teams.away?.winner && (
              <div
                style={{
                  position: "absolute",
                  top: "0",
                  left: "0",
                  right: "0",
                  bottom: "0",
                  backgroundColor: "rgba(82, 196, 26, 0.1)",
                  border: "2px solid #52c41a",
                  borderRadius: "4px",
                  zIndex: 0,
                }}
              />
            )}

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              zIndex: 1,
            }}
          >
            {game.teams.away?.logo && (
              <Image
                src={game.teams.away.logo}
                alt={game.teams.away.name}
                width={24}
                height={24}
                preview={false}
                fallback="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMIAAADDCAYAAADQvc6UAAABRWlDQ1BJQ0MgUHJvZmlsZQAAKJFjYGASSSwoyGFhYGDIzSspCnJ3UoiIjFJgf8LAwSDCIMogwMCcmFxc4BgQ4ANUwgCjUcG3awyMIPqyLsis7PPOq3QdDFcvjV3jOD1boQVTPQrgSkktTgbSf4A4LbmgqISBgTEFyFYuLykAsTuAbJEioKOA7DkgdjqEvQHEToKwj4DVhAQ5A9k3gGyB5IxEoBmML4BsnSQk8XQkNtReEOBxcfXxUQg1Mjc0dyHgXNJBSWpFCYh2zi+oLMpMzyhRcASGUqqCZ16yno6CkYGRAQMDKMwhqj/fAIcloxgHQqxAjIHBEugw5sUIsSQpBobtQPdLciLEVJYzMPBHMDBsayhILEqEO4DxG0txmrERhM29nYGBddr//5/DGRjYNRkY/l7////39v///y4Dmn+LgeHANwDrkl1AuO+pmgAAADhlWElmTU0AKgAAAAgAAYdpAAQAAAABAAAAGgAAAAAAAqACAAQAAAABAAAAwqADAAQAAAABAAAAwwAAAAD9b/HnAAAHlklEQVR4Ae3dP3Ik1RnG4W+FwQNAIyMjI2MjI2MjI0MjIyMjI2MjI2MjI2MjI2MjI2MjI2MjI2MjI2MjI2MjI2MjI2MjI2MjI2MjI2MjIyMjI2MjI2MjIyMjI2MjIyNHRkZGjoyMjByNjIyMjIyNjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjNf//59/5/+v/6k6tLhauR6YGzkauB4R2+7DQKdTqpZhAHAACAYgQDLGYYAIDhbAGAAAAQDACBAgJiAAAgQAAgAhAAAgIgIjI2MjI2MjIyMjI2NjIyMjIyMjIyMjI2MjIyMjI2MjIyMjI2MjIyMjI2MjIyMjI2MjIyMjI2MjI2MjI2MjI2MjI2MjI2MjI6gAAABYKElEQVR4AeStJw"
              />
            )}
            <div>
              <div
                style={{
                  fontWeight: "600",
                  fontSize: "12px",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <span>{game.teams.away?.abbreviation || "TBD"}</span>
                {getOverallRecord(game.teams.away?.records) && (
                  <span
                    style={{
                      fontSize: "10px",
                      color: "#666",
                      backgroundColor: "#f5f5f5",
                      padding: "1px 4px",
                      borderRadius: "3px",
                      fontWeight: "500",
                    }}
                  >
                    {getOverallRecord(game.teams.away?.records)}
                  </span>
                )}
              </div>
              <div style={{ fontSize: "10px", color: "#666" }}>
                {game.teams.away?.name || "Away Team"}
              </div>
            </div>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              zIndex: 1,
            }}
          >
            {/* Show score if game is live or completed */}
            {game.status &&
              (game.status.state === "in" || game.status.state === "post") &&
              game.teams.away?.score !== undefined &&
              game.teams.away?.score !== null && (
                <div
                  style={{
                    fontSize: "20px",
                    fontWeight: "800",
                    color:
                      game.status.state === "post" && game.teams.away?.winner
                        ? "#52c41a"
                        : "#262626",
                    minWidth: "30px",
                    textAlign: "center",
                    backgroundColor: "white",
                    padding: "2px 6px",
                    borderRadius: "4px",
                    border: "1px solid #d9d9d9",
                  }}
                >
                  {game.teams.away.score}
                </div>
              )}
            {game.favoredTeam === "away" &&
              game.status &&
              game.status.state === "pre" && (
                <Tag color="green" size="small">
                  FAV
                </Tag>
              )}
            {/* Winner badge for completed games */}
            {game.status &&
              game.status.state === "post" &&
              game.teams.away?.winner && (
                <Tag color="green" size="small" style={{ fontWeight: "600" }}>
                  WINNER
                </Tag>
              )}
          </div>
        </div>

        {/* Home Team */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "8px",
            backgroundColor: "#f6ffed",
            borderRadius: "4px",
            position: "relative",
          }}
        >
          {/* Winner indicator for completed games */}
          {game.status &&
            game.status.state === "post" &&
            game.teams.home?.winner && (
              <div
                style={{
                  position: "absolute",
                  top: "0",
                  left: "0",
                  right: "0",
                  bottom: "0",
                  backgroundColor: "rgba(82, 196, 26, 0.1)",
                  border: "2px solid #52c41a",
                  borderRadius: "4px",
                  zIndex: 0,
                }}
              />
            )}

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              zIndex: 1,
            }}
          >
            {game.teams.home?.logo && (
              <Image
                src={game.teams.home.logo}
                alt={game.teams.home.name}
                width={24}
                height={24}
                preview={false}
                fallback="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMIAAADDCAYAAADQvc6UAAABRWlDQ1BJQ0MgUHJvZmlsZQAAKJFjYGASSSwoyGFhYGDIzSspCnJ3UoiIjFJgf8LAwSDCIMogwMCcmFxc4BgQ4ANUwgCjUcG3awyMIPqyLsis7PPOq3QdDFcvjV3jOD1boQVTPQrgSkktTgbSf4A4LbmgqISBgTEFyFYuLykAsTuAbJEioKOA7DkgdjqEvQHEToKwj4DVhAQ5A9k3gGyB5IxEoBmML4BsnSQk8XQkNtReEOBxcfXxUQg1Mjc0dyHgXNJBSWpFCYh2zi+oLMpMzyhRcASGUqqCZ16yno6CkYGRAQMDKMwhqj/fAIcloxgHQqxAjIHBEugw5sUIsSQpBobtQPdLciLEVJYzMPBHMDBsayhILEqEO4DxG0txmrERhM29nYGBddr//5/DGRjYNRkY/l7////39v///y4Dmn+LgeHANwDrkl1AuO+pmgAAADhlWElmTU0AKgAAAAgAAYdpAAQAAAABAAAAGgAAAAAAAqACAAQAAAABAAAAwqADAAQAAAABAAAAwwAAAAD9b/HnAAAHlklEQVR4Ae3dP3Ik1RnG4W+FwQNAIyMjI2MjI2MjI0MjIyMjI2MjI2MjI2MjI2MjI2MjI2MjI2MjI2MjI2MjI2MjI2MjI2MjI2MjI2MjIyMjI2MjI2MjIyMjI2MjIyNHRkZGjoyMjByNjIyMjIyNjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjNf//59/5/+v/6k6tLhauR6YGzkauB4R2+7DQKdTqpZhAHAACAYgQDLGYYAIDhbAGAAAAQDACBAgJiAAAgQAAgAhAAAgIgIjI2MjI2MjIyMjI2NjIyMjIyMjIyMjI2MjIyMjI2MjIyMjI2MjIyMjI2MjIyMjI2MjIyMjI2MjI2MjI2MjI2MjI2MjI2MjI6gAAABYKElEQVR4AeStJw"
              />
            )}
            <div>
              <div
                style={{
                  fontWeight: "600",
                  fontSize: "12px",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <span>{game.teams.home?.abbreviation || "TBD"}</span>
                {getOverallRecord(game.teams.home?.records) && (
                  <span
                    style={{
                      fontSize: "10px",
                      color: "#666",
                      backgroundColor: "#f5f5f5",
                      padding: "1px 4px",
                      borderRadius: "3px",
                      fontWeight: "500",
                    }}
                  >
                    {getOverallRecord(game.teams.home?.records)}
                  </span>
                )}
              </div>
              <div style={{ fontSize: "10px", color: "#666" }}>
                {game.teams.home?.name || "Home Team"}
              </div>
            </div>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              zIndex: 1,
            }}
          >
            {/* Show score if game is live or completed */}
            {game.status &&
              (game.status.state === "in" || game.status.state === "post") &&
              game.teams.home?.score !== undefined &&
              game.teams.home?.score !== null && (
                <div
                  style={{
                    fontSize: "20px",
                    fontWeight: "800",
                    color:
                      game.status.state === "post" && game.teams.home?.winner
                        ? "#52c41a"
                        : "#262626",
                    minWidth: "30px",
                    textAlign: "center",
                    backgroundColor: "white",
                    padding: "2px 6px",
                    borderRadius: "4px",
                    border: "1px solid #d9d9d9",
                  }}
                >
                  {game.teams.home.score}
                </div>
              )}
            {game.favoredTeam === "home" &&
              game.status &&
              game.status.state === "pre" && (
                <Tag color="green" size="small">
                  FAV
                </Tag>
              )}
            {/* Winner badge for completed games */}
            {game.status &&
              game.status.state === "post" &&
              game.teams.home?.winner && (
                <Tag color="green" size="small" style={{ fontWeight: "600" }}>
                  WINNER
                </Tag>
              )}
          </div>
        </div>
      </div>

      {/* Betting Lines - Only show for pre-game */}
      {game.status && game.status.state === "pre" && (
        <>
          <Divider style={{ margin: "12px 0" }} />
          <div>
            <div style={{ marginBottom: "8px" }}>
              <Text strong style={{ fontSize: "12px" }}>
                Spread:
              </Text>
              <div style={{ fontSize: "14px", fontWeight: "600" }}>
                {game.spreadDetails || "No spread available"}
              </div>
              {!hasValidSpread && (
                <div
                  style={{
                    fontSize: "11px",
                    color: "#ff4d4f",
                    marginTop: "4px",
                    fontStyle: "italic",
                  }}
                >
                  Betting unavailable - no spread set
                </div>
              )}
            </div>

            {game.overUnder && (
              <div style={{ marginBottom: "12px" }}>
                <Text strong style={{ fontSize: "12px" }}>
                  Total:
                </Text>
                <div style={{ fontSize: "14px", fontWeight: "600" }}>
                  {game.overUnder}
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* Live Game Summary */}
      {game.status && game.status.state === "in" && (
        <>
          <Divider style={{ margin: "12px 0" }} />
          <div
            style={{
              textAlign: "center",
              padding: "12px",
              backgroundColor: "#fff2f0",
              borderRadius: "6px",
              border: "1px solid #ffccc7",
            }}
          >
            <Text strong style={{ fontSize: "14px", color: "#ff4d4f" }}>
              Live Game
            </Text>
            <div style={{ marginTop: "4px", fontSize: "12px", color: "#666" }}>
              Q{game.status.period} - {game.status.displayClock}
            </div>
          </div>
        </>
      )}

      {/* Betting Controls - Only show when selected */}
      {isSelected && (
        <div
          style={{
            marginTop: "16px",
            padding: "12px",
            backgroundColor: "#f6ffed",
            borderRadius: "6px",
            border: "1px solid #b7eb8f",
          }}
          onClick={(e) => e.stopPropagation()} // Prevent card click when interacting with controls
        >
          <Text strong style={{ fontSize: "12px", color: "#389e0d" }}>
            Betting Options:
          </Text>

          {/* Bet Type Selection */}
          <div style={{ marginTop: "8px", marginBottom: "12px" }}>
            <Radio.Group
              value={bet.betType}
              onChange={(e) => onBetTypeChange(game.game_id, e.target.value)}
              size="small"
            >
              <Radio.Button value="spread">Spread</Radio.Button>
              <Radio.Button value="overUnder" disabled={!game.overUnder}>
                Total
              </Radio.Button>
            </Radio.Group>
          </div>

          {/* Team/Option Selection */}
          <div style={{ marginBottom: "12px" }}>
            <div
              style={{ fontSize: "11px", marginBottom: "4px", color: "#666" }}
            >
              Choose {bet.betType === "spread" ? "team" : "option"}:
            </div>
            <Radio.Group
              value={bet.teamChoice}
              onChange={(e) => onTeamChoiceChange(game.game_id, e.target.value)}
              size="small"
              style={{ width: "100%" }}
            >
              {bet.betType === "spread" ? (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "4px",
                  }}
                >
                  <Radio value="away" style={{ fontSize: "11px" }}>
                    {game.teams.away?.abbreviation || "Away"}
                  </Radio>
                  <Radio value="home" style={{ fontSize: "11px" }}>
                    {game.teams.home?.abbreviation || "Home"}
                  </Radio>
                </div>
              ) : (
                <div style={{ display: "flex", gap: "8px" }}>
                  <Radio value="over">Over</Radio>
                  <Radio value="under">Under</Radio>
                </div>
              )}
            </Radio.Group>
          </div>

          {/* Points Selection */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Text style={{ fontSize: "11px", color: "#666" }}>Points:</Text>
            <div style={{ display: "flex", gap: "4px" }}>
              {[1, 2, 3].map((points) => {
                const isCurrentPointValue = bet.points === points;
                const isDisabled =
                  !isCurrentPointValue &&
                  duplicatePointValues?.includes(points);

                // Determine reason for disabling
                const isWeeklyTaken = weeklyTakenPoints?.includes(points);
                const isSessionDuplicate =
                  !isWeeklyTaken && duplicatePointValues?.includes(points);

                let tooltipTitle = "";
                if (isWeeklyTaken) {
                  tooltipTitle = `${points} points already used this week`;
                } else if (isSessionDuplicate) {
                  tooltipTitle = `${points} points already selected in another bet`;
                }

                const pointButton = (
                  <Button
                    key={points}
                    size="small"
                    type={isCurrentPointValue ? "primary" : "default"}
                    disabled={isDisabled}
                    onClick={() => onPointsChange(game.game_id, points)}
                    style={{
                      width: "32px",
                      height: "24px",
                      fontSize: "11px",
                      padding: "0",
                      opacity: isDisabled ? 0.5 : 1,
                    }}
                  >
                    {points}
                  </Button>
                );

                return isDisabled ? (
                  <Tooltip key={points} title={tooltipTitle}>
                    {pointButton}
                  </Tooltip>
                ) : (
                  pointButton
                );
              })}
            </div>
          </div>
        </div>
      )}
    </Card>
  );
};

export default GameCard;
