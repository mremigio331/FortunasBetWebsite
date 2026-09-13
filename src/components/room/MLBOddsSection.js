import React, { useMemo, useState } from "react";
import { Card, Space, Button, Alert, Tag, Row, Col, Empty, Tabs } from "antd";
import { TrophyOutlined, ReloadOutlined } from "@ant-design/icons";
import ErrorAlert from "../shared/ErrorAlert";
import MLBWeekSelector from "./MLBWeekSelector";
import WeekResolutionNotice from "./WeekResolutionNotice";
import BettingSummary from "./BettingSummary";
import GameCard from "./gameCard/GameCard";
import CurrentWeekUserBetsAlert from "./CurrentWeekUserBetsAlert";
import LoadingSpinner from "../shared/LoadingSpinner";

const MLBOddsSection = ({
  isMLBWeeksFetching,
  // Week_Resolution status, threaded down from `Room.js` via
  // `useMLBWeekSelection`, which gets the Current_Week from `useCurrentWeek` —
  // the single source of truth (Requirement 7.3).
  isWeekLoading = false,
  isWeekEstimate = false,
  isCurrentWeekOutOfRange = false,
  isOffSeason = false,
  selectedBets,
  selectedBetsCount,
  handleSubmitBets,
  totalPoints,
  handleClearBets,
  oddsRefetch,
  isOddsFetching,
  isCurrentUserAdmin,
  isMember,
  hasDuplicatePoints,
  isMembershipFetching,
  isDenied,
  isPending,
  selectedWeekNumber,
  handleWeekChange,
  weekOptions,
  currentWeekUserBets,
  weeklyTakenPoints,
  isMLBWeeksError,
  isOddsError,
  oddsError,
  hasOdds,
  memoizedOdds,
  memoizedOddsCount,
  oddsByDay = [],
  isBetCreating,
  duplicatePointValues,
  handleGameSelect,
  handleBetTypeChange,
  handleTeamChoiceChange,
  handlePointsChange,
  sportRules,
  sessionPointCounts,
  selectedWeek,
}) => {
  const maxBets = sportRules?.maxBetsPerWeek ?? 5;

  // Find the first day with games as default tab, or today's date
  const defaultTab = useMemo(() => {
    const today = new Date();
    const todayStr =
      today.getFullYear().toString() +
      String(today.getMonth() + 1).padStart(2, "0") +
      String(today.getDate()).padStart(2, "0");
    const todayDay = oddsByDay.find((d) => d.date === todayStr);
    if (todayDay) return todayDay.date;
    const firstWithGames = oddsByDay.find((d) => d.games.length > 0);
    return firstWithGames?.date || oddsByDay[0]?.date || "";
  }, [oddsByDay]);

  const [activeDay, setActiveDay] = useState(null);
  const currentTab = activeDay || defaultTab;

  const buildGameCards = (games) => {
    if (!games || games.length === 0) {
      return (
        <Empty
          description="No games scheduled for this day"
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      );
    }

    return (
      <Row gutter={[16, 16]}>
        {games.map((game) => {
          const isSelected = !!selectedBets[game.game_id];
          const bet = selectedBets[game.game_id];
          const totalBetsUsed = selectedBetsCount + weeklyTakenPoints.length;
          const weeklyPointCounts = weeklyTakenPoints.reduce((acc, p) => {
            acc[p] = (acc[p] || 0) + 1;
            return acc;
          }, {});

          const allPointsAtLimit =
            sportRules?.allowedPoints?.every((pt) => {
              const weeklyUsed = weeklyPointCounts[pt] || 0;
              const sessionUsed = sessionPointCounts[pt] || 0;
              const limit = sportRules.pointLimits?.[pt] ?? 1;
              return weeklyUsed + sessionUsed >= limit;
            }) ?? false;

          const canSelect =
            (totalBetsUsed < maxBets || isSelected) &&
            (!allPointsAtLimit || isSelected) &&
            (isCurrentUserAdmin || isMember);
          const hasConflictingPoints =
            isSelected && bet && duplicatePointValues.includes(bet.points);

          return (
            <Col xs={24} sm={12} lg={8} key={game.game_id}>
              <GameCard
                game={game}
                isSelected={isSelected}
                bet={bet}
                canSelect={canSelect}
                hasConflictingPoints={hasConflictingPoints}
                duplicatePointValues={duplicatePointValues}
                weeklyTakenPoints={weeklyTakenPoints}
                onGameSelect={handleGameSelect}
                onBetTypeChange={handleBetTypeChange}
                onTeamChoiceChange={handleTeamChoiceChange}
                onPointsChange={handlePointsChange}
                roomSport="MLB"
                sportRules={sportRules}
                sessionPointCounts={sessionPointCounts}
              />
            </Col>
          );
        })}
      </Row>
    );
  };

  const tabItems = useMemo(() => {
    return oddsByDay.map((day) => ({
      key: day.date,
      label: (
        <span>
          {day.label}
          {day.games.length > 0 && (
            <Tag
              color="blue"
              style={{ marginLeft: 6, fontSize: "11px", padding: "0 4px" }}
            >
              {day.games.length}
            </Tag>
          )}
        </span>
      ),
      children: buildGameCards(day.games),
    }));
  }, [
    oddsByDay,
    selectedBets,
    selectedBetsCount,
    weeklyTakenPoints,
    sessionPointCounts,
    duplicatePointValues,
    sportRules,
    isCurrentUserAdmin,
    isMember,
  ]);

  if (isMLBWeeksFetching) {
    return (
      <Card
        title={
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <TrophyOutlined />
            MLB Betting Odds
          </div>
        }
      >
        <LoadingSpinner message="Loading MLB schedule..." />
      </Card>
    );
  }

  return (
    <Card
      title={
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <TrophyOutlined />
          MLB Betting Odds
          {(selectedBetsCount > 0 || weeklyTakenPoints.length > 0) && (
            <Tag color="blue">
              {selectedBetsCount + weeklyTakenPoints.length}/{maxBets} bets this
              week
              {selectedBetsCount > 0 && weeklyTakenPoints.length > 0
                ? ` (${weeklyTakenPoints.length} placed, ${selectedBetsCount} new)`
                : ""}
            </Tag>
          )}
        </div>
      }
      extra={
        <Space>
          {selectedBetsCount > 0 && (
            <>
              <Button
                type="primary"
                onClick={handleSubmitBets}
                disabled={
                  selectedBetsCount === 0 ||
                  hasDuplicatePoints ||
                  (!isCurrentUserAdmin && !isMember)
                }
              >
                Submit Bets ({totalPoints} pts)
              </Button>
              <Button onClick={handleClearBets}>Clear All</Button>
            </>
          )}
          <Button
            icon={<ReloadOutlined />}
            onClick={oddsRefetch}
            loading={isOddsFetching}
            size="small"
          >
            Refresh
          </Button>
        </Space>
      }
    >
      {/* Membership Status Alert for Non-Members */}
      {!isMembershipFetching && !isCurrentUserAdmin && !isMember && (
        <Alert
          message={
            isDenied
              ? "Access Denied"
              : isPending
                ? "Membership Pending"
                : "Member Access Required"
          }
          description={
            isDenied
              ? "Your request to join this room was denied. You cannot place bets."
              : isPending
                ? "Your membership request is pending approval. You cannot place bets until approved."
                : "You must be a member of this room to place bets. Please request to join the room."
          }
          type={isDenied ? "error" : isPending ? "warning" : "info"}
          showIcon
          style={{ marginBottom: "16px" }}
        />
      )}

      <MLBWeekSelector
        selectedWeekNumber={selectedWeekNumber}
        onWeekChange={(val) => {
          setActiveDay(null);
          handleWeekChange(val);
        }}
        weekOptions={weekOptions}
        isWeekLoading={isWeekLoading}
      />

      <WeekResolutionNotice
        isWeekLoading={isWeekLoading}
        isWeekEstimate={isWeekEstimate}
        isCurrentWeekOutOfRange={isCurrentWeekOutOfRange}
        isOffSeason={isOffSeason}
      />

      <CurrentWeekUserBetsAlert
        currentWeekUserBets={currentWeekUserBets}
        selectedWeek={selectedWeekNumber}
        weeklyTakenPoints={weeklyTakenPoints}
        roomSport="MLB"
        sportRules={sportRules}
      />

      {isMLBWeeksError && (
        <Alert
          message="Error Loading MLB Schedule"
          description="Failed to load available MLB weeks for this room's date range."
          type="warning"
          showIcon
          style={{ marginBottom: "16px" }}
        />
      )}

      {isOddsFetching && <LoadingSpinner message="Loading MLB odds..." />}

      {isOddsError && (
        <div style={{ marginBottom: "16px" }}>
          <ErrorAlert
            title="Error Loading Odds"
            description={oddsError?.message || "Failed to load MLB odds"}
            onRetry={oddsRefetch}
          />
        </div>
      )}

      {!isOddsFetching && !isOddsError && !hasOdds && (
        <Empty
          description="No odds available for this week"
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      )}

      {!isOddsFetching && !isOddsError && hasOdds && (
        <>
          <BettingSummary selectedBets={selectedBets} nflOdds={memoizedOdds} />
          <MLBStatusMessages
            oddsCount={memoizedOddsCount}
            selectedWeek={selectedWeek}
            selectedWeekNumber={selectedWeekNumber}
            selectedBetsCount={selectedBetsCount}
            hasDuplicatePoints={hasDuplicatePoints}
            sportRules={sportRules}
            weeklyTakenPoints={weeklyTakenPoints}
            sessionPointCounts={sessionPointCounts}
          />

          {selectedBetsCount > 0 && (
            <div style={{ marginBottom: "16px", textAlign: "center" }}>
              <Space>
                <Button
                  type="primary"
                  size="large"
                  onClick={handleSubmitBets}
                  loading={isBetCreating}
                  disabled={hasDuplicatePoints || selectedBetsCount === 0}
                  style={{
                    backgroundColor: hasDuplicatePoints ? undefined : "#52c41a",
                    borderColor: hasDuplicatePoints ? undefined : "#52c41a",
                  }}
                >
                  {isBetCreating
                    ? "Placing Bets..."
                    : `Place ${selectedBetsCount} Bet${selectedBetsCount !== 1 ? "s" : ""}`}
                </Button>
                <Button
                  type="default"
                  size="large"
                  onClick={handleClearBets}
                  disabled={isBetCreating || selectedBetsCount === 0}
                >
                  Clear All
                </Button>
              </Space>
            </div>
          )}

          <Tabs
            activeKey={currentTab}
            onChange={setActiveDay}
            type="card"
            size="small"
            items={tabItems}
          />
        </>
      )}
    </Card>
  );
};

/**
 * MLB-specific status messages
 */
const MLBStatusMessages = ({
  oddsCount,
  selectedWeek,
  selectedWeekNumber,
  selectedBetsCount,
  hasDuplicatePoints,
  sportRules,
  weeklyTakenPoints = [],
  sessionPointCounts = {},
}) => {
  const maxBets = sportRules?.maxBetsPerWeek ?? 5;
  const existingBetCount = weeklyTakenPoints.length;
  const totalBetsUsed = selectedBetsCount + existingBetCount;
  const remainingSlots = Math.max(0, maxBets - totalBetsUsed);

  const weekLabel = selectedWeek
    ? (() => {
        const start = new Date(selectedWeek.start * 1000);
        const end = new Date(selectedWeek.end * 1000);
        const fmt = (d) =>
          d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
        return `Week ${selectedWeekNumber} (${fmt(start)} - ${fmt(end)})`;
      })()
    : `Week ${selectedWeekNumber}`;

  const pointRemainingInfo = (sportRules?.allowedPoints || []).map((pt) => {
    const weeklyUsed = weeklyTakenPoints.filter((p) => p === pt).length;
    const sessionUsed = sessionPointCounts[pt] || 0;
    const limit = sportRules?.pointLimits?.[pt] ?? 0;
    const remaining = Math.max(0, limit - weeklyUsed - sessionUsed);
    const label = sportRules?.pointLabels?.[pt] ?? pt;
    return { pt, label, remaining, limit };
  });

  return (
    <div style={{ marginBottom: "16px" }}>
      <span style={{ fontWeight: 600 }}>
        Found {oddsCount} games for {weekLabel}
      </span>
      {totalBetsUsed < maxBets && (
        <div style={{ marginTop: "4px" }}>
          <span style={{ fontSize: "12px", color: "rgba(0,0,0,0.45)" }}>
            Click on games to select them for betting.{" "}
            {existingBetCount > 0
              ? `You have ${existingBetCount} existing bet${existingBetCount !== 1 ? "s" : ""} this week. ${remainingSlots} slot${remainingSlots !== 1 ? "s" : ""} remaining.`
              : `You can select up to ${maxBets} games.`}
          </span>
        </div>
      )}
      {totalBetsUsed < maxBets && (
        <div style={{ marginTop: "4px" }}>
          <span style={{ fontSize: "12px", color: "rgba(0,0,0,0.45)" }}>
            {pointRemainingInfo
              .map(
                (info) => `${info.label}: ${info.remaining}/${info.limit} left`,
              )
              .join(" · ")}
          </span>
        </div>
      )}
      {hasDuplicatePoints && (
        <div style={{ marginTop: "4px" }}>
          <span style={{ fontSize: "12px", color: "#ff4d4f" }}>
            ⚠️ You've exceeded the allowed limits. MLB allows max {maxBets}{" "}
            bets: up to {sportRules?.pointLimits?.[1] ?? 4} at 1pt and{" "}
            {sportRules?.pointLimits?.[6] ?? 1} at 6pt. Please adjust your
            selections.
          </span>
        </div>
      )}
      {totalBetsUsed >= maxBets &&
        !hasDuplicatePoints &&
        selectedBetsCount > 0 && (
          <div style={{ marginTop: "4px" }}>
            <span style={{ fontSize: "12px", color: "#52c41a" }}>
              ✓ All {maxBets} bet slots filled! Ready to submit bets.
            </span>
          </div>
        )}
    </div>
  );
};

export default MLBOddsSection;
