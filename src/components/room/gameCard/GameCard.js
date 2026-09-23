import React from "react";
import { Card } from "antd";
import { CheckCircleOutlined } from "@ant-design/icons";
import GameCardHeader from "./GameCardHeader";
import TeamRow from "./TeamRow";
import BettingLines from "./BettingLines";
import BettingGrid from "./BettingGrid";

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
  onSelectSpread,
  onSelectTotal,
  onPointsChange,
  roomSport = "NFL",
  sportRules,
  sessionPointCounts = {},
}) => {
  const hasValidSpread =
    game.spread !== null && game.spread !== undefined && game.spread !== 0;

  const hasValidTotal = game.overUnder !== null && game.overUnder !== undefined;

  const isGameSelectable =
    canSelect &&
    game.status &&
    game.status.state === "pre" &&
    (hasValidSpread || hasValidTotal);

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

      <GameCardHeader game={game} roomSport={roomSport} />

      <div style={{ marginBottom: 16 }}>
        <TeamRow
          team={game.teams.away}
          homeAway="away"
          gameStatus={game.status}
          favoredTeam={game.favoredTeam}
          backgroundColor="#fafafa"
        />
        <TeamRow
          team={game.teams.home}
          homeAway="home"
          gameStatus={game.status}
          favoredTeam={game.favoredTeam}
          backgroundColor="#f6ffed"
        />
      </div>

      <BettingLines
        game={game}
        hasValidSpread={hasValidSpread}
        hasValidTotal={hasValidTotal}
        roomSport={roomSport}
      />

      {isSelected && (
        <BettingGrid
          game={game}
          bet={bet}
          hasValidSpread={hasValidSpread}
          hasValidTotal={hasValidTotal}
          onSelectSpread={onSelectSpread}
          onSelectTotal={onSelectTotal}
          onPointsChange={onPointsChange}
          roomSport={roomSport}
          sportRules={sportRules}
          weeklyTakenPoints={weeklyTakenPoints}
          duplicatePointValues={duplicatePointValues}
          sessionPointCounts={sessionPointCounts}
        />
      )}
    </Card>
  );
};

export default GameCard;
