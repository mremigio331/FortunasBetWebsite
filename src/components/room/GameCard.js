import React from "react";
import {
  Card,
  Typography,
  Tag,
  Button,
  Divider,
  Radio,
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
  // ----- helpers -----
  const getOverallRecord = (records) => {
    const overallRecord = records?.find(
      (r) => r.name === "overall" || r.type === "total",
    );
    return overallRecord?.summary || "";
  };

  const hasValidSpread =
    game.spread !== null && game.spread !== undefined && game.spreadDetails;

  const isGameSelectable =
    canSelect && game.status && game.status.state === "pre" && hasValidSpread;

  // Derive per-side lines from favoredTeam + spread magnitude
  const spreadAbs =
    game.spread !== null && game.spread !== undefined
      ? Math.abs(Number(game.spread))
      : null;

  const homeLine =
    spreadAbs == null
      ? null
      : game.favoredTeam === "home"
        ? -spreadAbs
        : +spreadAbs;

  const awayLine =
    spreadAbs == null
      ? null
      : game.favoredTeam === "away"
        ? -spreadAbs
        : +spreadAbs;

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
    <Card
      size="small"
      style={{
        border: hasConflictingPoints
          ? "2px solid #ff4d4f"
          : isSelected
            ? "2px solid #1890ff"
            : "1px solid #f0f0f0",
        borderRadius: 8,
        height: "100%",
        cursor: isGameSelectable ? "pointer" : "not-allowed",
        boxShadow: hasConflictingPoints
          ? "0 4px 12px rgba(255, 77, 79, 0.15)"
          : isSelected
            ? "0 4px 12px rgba(24, 144, 255, 0.15)"
            : undefined,
        opacity: isGameSelectable ? 1 : 0.6,
        filter: isGameSelectable ? "none" : "grayscale(30%)",
        position: "relative",
      }}
      bodyStyle={{ padding: 16 }}
      onClick={() => isGameSelectable && onGameSelect(game.game_id)}
      hoverable={isGameSelectable}
    >
      {/* Selection Indicator */}
      {isSelected && (
        <div style={{ position: "absolute", top: 8, right: 8, zIndex: 1 }}>
          <CheckCircleOutlined
            style={{
              color: hasConflictingPoints ? "#ff4d4f" : "#1890ff",
              fontSize: 20,
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
            top: 8,
            left: 8,
            zIndex: 1,
            backgroundColor: "#ff4d4f",
            color: "white",
            padding: "2px 6px",
            borderRadius: 4,
            fontSize: 10,
            fontWeight: 600,
          }}
        >
          {weeklyTakenPoints?.includes(bet.points)
            ? "USED THIS WEEK"
            : "DUPLICATE"}
        </div>
      )}

      {/* Game Header */}
      <div style={{ textAlign: "center", marginBottom: 12 }}>
        <Text strong style={{ fontSize: 14 }}>
          {new Date(game.date).toLocaleDateString("en-US", {
            weekday: "short",
            month: "short",
            day: "numeric",
            hour: "numeric",
            minute: "2-digit",
          })}
        </Text>

        {/* Venue */}
        {game.venue && (game.venue.name || game.venue.city) && (
          <div
            style={{
              fontSize: 10,
              color: "#666",
              marginTop: 2,
              fontStyle: "italic",
            }}
          >
            {game.venue.name && game.venue.city
              ? `${game.venue.name}, ${game.venue.city}${
                  game.venue.state ? `, ${game.venue.state}` : ""
                }`
              : game.venue.name ||
                `${game.venue.city}${
                  game.venue.state ? `, ${game.venue.state}` : ""
                }`}
            {game.venue.indoor && (
              <span
                style={{
                  marginLeft: 4,
                  fontSize: 9,
                  backgroundColor: "#e6f7ff",
                  color: "#1890ff",
                  padding: "1px 3px",
                  borderRadius: 2,
                }}
              >
                INDOOR
              </span>
            )}
          </div>
        )}

        {/* Status */}
        {game.status && (
          <div style={{ marginTop: 4 }}>
            {game.status.state === "in" ? (
              <div
                style={{
                  fontSize: 12,
                  color: "#ff4d4f",
                  fontWeight: 600,
                  backgroundColor: "#fff2f0",
                  padding: "2px 6px",
                  borderRadius: 4,
                  display: "inline-block",
                }}
              >
                🔴 LIVE - Q{game.status.period} {game.status.displayClock}
              </div>
            ) : game.status.state === "post" ? (
              <div
                style={{
                  fontSize: 12,
                  color: "#52c41a",
                  fontWeight: 600,
                  backgroundColor: "#f6ffed",
                  padding: "2px 6px",
                  borderRadius: 4,
                  display: "inline-block",
                }}
              >
                ✅ {game.status.shortDetail || "FINAL"}
              </div>
            ) : (
              <div style={{ fontSize: 11, color: "#666", marginTop: 2 }}>
                {game.status.shortDetail || "Scheduled"}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Teams */}
      <div style={{ marginBottom: 16 }}>
        {/* Away */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 8,
            padding: 8,
            backgroundColor: "#fafafa",
            borderRadius: 4,
            position: "relative",
          }}
        >
          {game.status?.state === "post" && game.teams.away?.winner && (
            <div
              style={{
                position: "absolute",
                inset: 0,
                backgroundColor: "rgba(82, 196, 26, 0.1)",
                border: "2px solid #52c41a",
                borderRadius: 4,
                zIndex: 0,
              }}
            />
          )}
          <div
            style={{ display: "flex", alignItems: "center", gap: 8, zIndex: 1 }}
          >
            {game.teams.away?.logo && (
              <Image
                src={game.teams.away.logo}
                alt={game.teams.away.name}
                width={24}
                height={24}
                preview={false}
              />
            )}
            <div>
              <div
                style={{
                  fontWeight: 600,
                  fontSize: 12,
                  display: "flex",
                  gap: 6,
                }}
              >
                <span>{game.teams.away?.abbreviation || "Away"}</span>
                {getOverallRecord(game.teams.away?.records) && (
                  <span
                    style={{
                      fontSize: 10,
                      color: "#666",
                      backgroundColor: "#f5f5f5",
                      padding: "1px 4px",
                      borderRadius: 3,
                      fontWeight: 500,
                    }}
                  >
                    {getOverallRecord(game.teams.away?.records)}
                  </span>
                )}
              </div>
              <div style={{ fontSize: 10, color: "#666" }}>
                {game.teams.away?.name || "Away Team"}
              </div>
            </div>
          </div>
          <div
            style={{ display: "flex", alignItems: "center", gap: 8, zIndex: 1 }}
          >
            {(game.status?.state === "in" || game.status?.state === "post") &&
              game.teams.away?.score != null && (
                <div
                  style={{
                    fontSize: 20,
                    fontWeight: 800,
                    color:
                      game.status.state === "post" && game.teams.away?.winner
                        ? "#52c41a"
                        : "#262626",
                    minWidth: 30,
                    textAlign: "center",
                    backgroundColor: "white",
                    padding: "2px 6px",
                    borderRadius: 4,
                    border: "1px solid #d9d9d9",
                  }}
                >
                  {game.teams.away.score}
                </div>
              )}
            {game.favoredTeam === "away" && game.status?.state === "pre" && (
              <Tag color="green" size="small">
                FAV
              </Tag>
            )}
            {game.status?.state === "post" && game.teams.away?.winner && (
              <Tag color="green" size="small" style={{ fontWeight: 600 }}>
                WINNER
              </Tag>
            )}
          </div>
        </div>

        {/* Home */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: 8,
            backgroundColor: "#f6ffed",
            borderRadius: 4,
            position: "relative",
          }}
        >
          {game.status?.state === "post" && game.teams.home?.winner && (
            <div
              style={{
                position: "absolute",
                inset: 0,
                backgroundColor: "rgba(82, 196, 26, 0.1)",
                border: "2px solid #52c41a",
                borderRadius: 4,
                zIndex: 0,
              }}
            />
          )}
          <div
            style={{ display: "flex", alignItems: "center", gap: 8, zIndex: 1 }}
          >
            {game.teams.home?.logo && (
              <Image
                src={game.teams.home.logo}
                alt={game.teams.home.name}
                width={24}
                height={24}
                preview={false}
              />
            )}
            <div>
              <div
                style={{
                  fontWeight: 600,
                  fontSize: 12,
                  display: "flex",
                  gap: 6,
                }}
              >
                <span>{game.teams.home?.abbreviation || "Home"}</span>
                {getOverallRecord(game.teams.home?.records) && (
                  <span
                    style={{
                      fontSize: 10,
                      color: "#666",
                      backgroundColor: "#f5f5f5",
                      padding: "1px 4px",
                      borderRadius: 3,
                      fontWeight: 500,
                    }}
                  >
                    {getOverallRecord(game.teams.home?.records)}
                  </span>
                )}
              </div>
              <div style={{ fontSize: 10, color: "#666" }}>
                {game.teams.home?.name || "Home Team"}
              </div>
            </div>
          </div>
          <div
            style={{ display: "flex", alignItems: "center", gap: 8, zIndex: 1 }}
          >
            {(game.status?.state === "in" || game.status?.state === "post") &&
              game.teams.home?.score != null && (
                <div
                  style={{
                    fontSize: 20,
                    fontWeight: 800,
                    color:
                      game.status.state === "post" && game.teams.home?.winner
                        ? "#52c41a"
                        : "#262626",
                    minWidth: 30,
                    textAlign: "center",
                    backgroundColor: "white",
                    padding: "2px 6px",
                    borderRadius: 4,
                    border: "1px solid #d9d9d9",
                  }}
                >
                  {game.teams.home.score}
                </div>
              )}
            {game.favoredTeam === "home" && game.status?.state === "pre" && (
              <Tag color="green" size="small">
                FAV
              </Tag>
            )}
            {game.status?.state === "post" && game.teams.home?.winner && (
              <Tag color="green" size="small" style={{ fontWeight: 600 }}>
                WINNER
              </Tag>
            )}
          </div>
        </div>
      </div>

      {/* Betting Lines - Only pre-game */}
      {game.status?.state === "pre" && (
        <>
          <Divider style={{ margin: "12px 0" }} />
          <div>
            <div style={{ marginBottom: 8 }}>
              <Text strong style={{ fontSize: 12 }}>
                Spread:
              </Text>
              <div style={{ fontSize: 14, fontWeight: 600 }}>
                {/* Keep the book’s headline for display, but radios show side-specific */}
                {game.spreadDetails || "No spread available"}
              </div>
              {!hasValidSpread && (
                <div
                  style={{
                    fontSize: 11,
                    color: "#ff4d4f",
                    marginTop: 4,
                    fontStyle: "italic",
                  }}
                >
                  Betting unavailable - no spread set
                </div>
              )}
            </div>

            {game.overUnder && (
              <div style={{ marginBottom: 12 }}>
                <Text strong style={{ fontSize: 12 }}>
                  Total:
                </Text>
                <div style={{ fontSize: 14, fontWeight: 600 }}>
                  {game.overUnder}
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* Betting Controls */}
      {isSelected && (
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
              <Radio.Button value="spread">Spread</Radio.Button>
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
              value={bet.teamChoice ?? null} // make sure initial is null, not "home"
              onChange={(e) => handleTeamChange(e.target.value)}
              size="small"
              style={{ width: "100%" }}
            >
              {bet.betType === "spread" ? (
                <div
                  style={{ display: "flex", flexDirection: "column", gap: 4 }}
                >
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
              {[1, 2, 3].map((points) => {
                const isCurrent = bet.points === points;
                const isWeeklyTaken = weeklyTakenPoints?.includes(points);
                const isSessionDup =
                  !isWeeklyTaken && duplicatePointValues?.includes(points);
                const disabled = !isCurrent && (isWeeklyTaken || isSessionDup);

                let title = "";
                if (isWeeklyTaken)
                  title = `${points} points already used this week`;
                else if (isSessionDup)
                  title = `${points} points already selected in another bet`;

                const btn = (
                  <Button
                    key={points}
                    size="small"
                    type={isCurrent ? "primary" : "default"}
                    disabled={disabled}
                    onClick={() => onPointsChange(game.game_id, points)}
                    style={{
                      width: 32,
                      height: 24,
                      fontSize: 11,
                      padding: 0,
                      opacity: disabled ? 0.5 : 1,
                    }}
                  >
                    {points}
                  </Button>
                );

                return disabled ? (
                  <Tooltip key={points} title={title}>
                    {btn}
                  </Tooltip>
                ) : (
                  btn
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
