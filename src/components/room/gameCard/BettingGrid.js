import React from "react";
import { Typography, Tag, Button, Tooltip } from "antd";
import useIsMobile from "../../../hooks/useIsMobile";
import { signedLineForSide, formatLine } from "../../../utils/spreadFormat";

const { Text } = Typography;

/**
 * Mobile-first sportsbook-style selection grid. One row per team; each row
 * exposes a spread cell and a total cell. A single tap sets the bet type, the
 * team/over-under choice, and the exact signed line in one action — there is
 * no separate "choose bet type" then "choose team" step.
 *
 *                     SPREAD        TOTAL
 *   Green Bay (away)  [ -3.5 ]      [ O 44.5 ]
 *   NY Jets  (home)   [ +3.5 ]      [ U 44.5 ]
 *
 * Touch targets are sized for thumbs (>=44px tall on mobile), selection state
 * is conveyed by fill color (no hover dependence), and the total is a
 * game-level number shown as O/U so it never reads as a team total.
 */
const BettingGrid = ({
  game,
  bet,
  hasValidSpread,
  hasValidTotal,
  onSelectSpread,
  onSelectTotal,
  onPointsChange,
  roomSport,
  sportRules,
  weeklyTakenPoints,
  duplicatePointValues,
  sessionPointCounts,
}) => {
  const isMobile = useIsMobile();
  const cellHeight = isMobile ? 48 : 40;
  const cellFontSize = isMobile ? 15 : 13;
  const gap = isMobile ? 10 : 8;

  const awayAbbr = game.teams?.away?.abbreviation || "Away";
  const homeAbbr = game.teams?.home?.abbreviation || "Home";

  const awayLine = signedLineForSide("away", {
    spread: game.spread,
    favoredTeam: game.favoredTeam,
  });
  const homeLine = signedLineForSide("home", {
    spread: game.spread,
    favoredTeam: game.favoredTeam,
  });

  const isSpread = bet?.betType === "spread";
  const isTotal = bet?.betType === "overUnder";
  const spreadAwaySelected = isSpread && bet?.teamChoice === "away";
  const spreadHomeSelected = isSpread && bet?.teamChoice === "home";
  const totalOverSelected = isTotal && bet?.overUnderChoice === "over";
  const totalUnderSelected = isTotal && bet?.overUnderChoice === "under";

  const cellStyle = (selected, disabled) => ({
    flex: 1,
    minWidth: 0,
    height: cellHeight,
    fontSize: cellFontSize,
    fontWeight: 600,
    opacity: disabled ? 0.45 : 1,
    ...(selected
      ? { backgroundColor: "#1890ff", borderColor: "#1890ff", color: "white" }
      : {}),
  });

  const SpreadCell = ({ side, line, selected }) => {
    const disabled = !hasValidSpread || line === null;
    return (
      <Button
        aria-label={`Spread ${side === "away" ? awayAbbr : homeAbbr} ${
          disabled ? "unavailable" : formatLine(line)
        }`}
        aria-pressed={selected}
        disabled={disabled}
        style={cellStyle(selected, disabled)}
        onClick={(e) => {
          e.stopPropagation();
          onSelectSpread(game.game_id, {
            teamChoice: side,
            takenLine: line,
            game,
          });
        }}
      >
        {disabled ? "N/A" : formatLine(line)}
      </Button>
    );
  };

  const TotalCell = ({ choice, selected }) => {
    const disabled = !hasValidTotal;
    const prefix = choice === "over" ? "O" : "U";
    return (
      <Button
        aria-label={`Total ${choice} ${disabled ? "unavailable" : game.overUnder}`}
        aria-pressed={selected}
        disabled={disabled}
        style={cellStyle(selected, disabled)}
        onClick={(e) => {
          e.stopPropagation();
          onSelectTotal(game.game_id, { overUnderChoice: choice, game });
        }}
      >
        {disabled ? "N/A" : `${prefix} ${game.overUnder}`}
      </Button>
    );
  };

  const TeamGridRow = ({
    abbr,
    side,
    line,
    spreadSelected,
    totalChoice,
    totalSelected,
    isFav,
  }) => (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap,
        marginBottom: gap,
      }}
    >
      <div
        style={{
          width: isMobile ? 60 : 72,
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          gap: 4,
        }}
      >
        <Text strong style={{ fontSize: isMobile ? 13 : 12 }}>
          {abbr}
        </Text>
        {isFav && (
          <Tag
            color="green"
            size="small"
            style={{ margin: 0, lineHeight: "16px", padding: "0 4px" }}
          >
            FAV
          </Tag>
        )}
      </div>
      <SpreadCell side={side} line={line} selected={spreadSelected} />
      <TotalCell choice={totalChoice} selected={totalSelected} />
    </div>
  );

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
      {/* Column headers */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap,
          marginBottom: gap,
        }}
      >
        <div style={{ width: isMobile ? 60 : 72, flexShrink: 0 }} />
        <Text
          strong
          style={{
            flex: 1,
            textAlign: "center",
            fontSize: 11,
            color: "#389e0d",
          }}
        >
          SPREAD
        </Text>
        <Text
          strong
          style={{
            flex: 1,
            textAlign: "center",
            fontSize: 11,
            color: "#389e0d",
          }}
        >
          TOTAL
        </Text>
      </div>

      <TeamGridRow
        abbr={awayAbbr}
        side="away"
        line={awayLine}
        spreadSelected={spreadAwaySelected}
        totalChoice="over"
        totalSelected={totalOverSelected}
        isFav={game.favoredTeam === "away"}
      />
      <TeamGridRow
        abbr={homeAbbr}
        side="home"
        line={homeLine}
        spreadSelected={spreadHomeSelected}
        totalChoice="under"
        totalSelected={totalUnderSelected}
        isFav={game.favoredTeam === "home"}
      />

      {/* Plain-language confirmation of the current pick */}
      {bet && (isSpread ? bet.teamChoice : bet.overUnderChoice) && (
        <div
          style={{
            marginTop: 2,
            marginBottom: 12,
            fontSize: isMobile ? 12 : 11,
            color: "#389e0d",
            fontWeight: 500,
          }}
        >
          {isSpread
            ? `You're taking ${
                bet.teamChoice === "away" ? awayAbbr : homeAbbr
              } ${formatLine(bet.teamChoice === "away" ? awayLine : homeLine)}`
            : `You're taking ${
                bet.overUnderChoice === "over" ? "OVER" : "UNDER"
              } ${game.overUnder}`}
        </div>
      )}

      {/* Points selection */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap,
          flexWrap: "wrap",
        }}
      >
        <Text style={{ fontSize: isMobile ? 12 : 11, color: "#666" }}>
          Points:
        </Text>
        <div style={{ display: "flex", gap, flexWrap: "wrap" }}>
          {(sportRules?.allowedPoints || [1, 2, 3]).map((points) => {
            const isCurrent = bet?.points === points;
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
              const sessionCount = sessionPointCounts?.[points] || 0;
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
                type={isCurrent ? "primary" : "default"}
                disabled={disabled}
                onClick={(e) => {
                  e.stopPropagation();
                  onPointsChange(game.game_id, points);
                }}
                style={{
                  minWidth: isBigBet ? 72 : isMobile ? 44 : 32,
                  height: isMobile ? 40 : 24,
                  fontSize: isMobile ? 13 : 11,
                  padding: "0 8px",
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

export default BettingGrid;
