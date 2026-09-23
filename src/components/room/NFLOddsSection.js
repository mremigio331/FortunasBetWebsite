import React from "react";
import {
  Card,
  Space,
  Button,
  Alert,
  Tag,
  Row,
  Col,
  Empty,
  Divider,
} from "antd";
import { TrophyOutlined, ReloadOutlined } from "@ant-design/icons";
import ErrorAlert from "../shared/ErrorAlert";
import WeekYearSelector from "./WeekYearSelector";
import WeekResolutionNotice from "./WeekResolutionNotice";
import BettingSummary from "./BettingSummary";
import StatusMessages from "./StatusMessages";
import GameCard from "./gameCard/GameCard";
import CurrentWeekUserBetsAlert from "./CurrentWeekUserBetsAlert";
import RoomBetsDisplay from "./RoomBetsDisplay";
import LoadingSpinner from "../shared/LoadingSpinner";

const NFLOddsSection = ({
  isNFLWeeksFetching,
  // Week_Resolution status, threaded down from `Room.js` via
  // `useNFLWeekSelection`. This component does NOT resolve the current week
  // itself — it used to call `useGetCurrentNflWeek` and seed the selection with
  // its own adopt-on-empty effect, which is exactly the duplication
  // Requirements 7.3 / 7.4 rule out.
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
  selectedSeasonType,
  handleSeasonTypeChange,
  selectedYear,
  handleYearChange,
  selectedWeek,
  handleWeekChange,
  weekOptions,
  yearOptions,
  seasonTypeOptions,
  currentWeekUserBets,
  weeklyTakenPoints,
  isNFLWeeksError,
  isOddsError,
  oddsError,
  hasOdds,
  memoizedNflOdds,
  memoizedOddsCount,
  isBetCreating,
  duplicatePointValues,
  handleGameSelect,
  handleBetTypeChange,
  handleTeamChoiceChange,
  handleSelectSpread,
  handleSelectTotal,
  handlePointsChange,
  roomId,
  roomSport = "NFL",
  sportRules,
  sessionPointCounts,
}) => {
  if (isNFLWeeksFetching) {
    return (
      <Card
        title={
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <TrophyOutlined />
            {roomSport === "MLB" ? "MLB" : "NFL"} Betting Odds
          </div>
        }
      >
        <LoadingSpinner
          message={`Loading ${roomSport === "MLB" ? "MLB" : "NFL"} odds...`}
        />
      </Card>
    );
  }
  const maxBets = sportRules?.maxBetsPerWeek ?? 3;

  return (
    <Card
      title={
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <TrophyOutlined />
          {roomSport === "MLB" ? "MLB" : "NFL"} Betting Odds
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
      <WeekYearSelector
        selectedSeasonType={selectedSeasonType}
        onSeasonTypeChange={handleSeasonTypeChange}
        selectedYear={selectedYear}
        onYearChange={handleYearChange}
        selectedWeek={selectedWeek}
        onWeekChange={handleWeekChange}
        weekOptions={weekOptions}
        yearOptions={yearOptions}
        seasonTypeOptions={seasonTypeOptions}
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
        selectedWeek={selectedWeek}
        weeklyTakenPoints={weeklyTakenPoints}
        roomSport={roomSport}
        sportRules={sportRules}
      />
      {isNFLWeeksError && (
        <Alert
          message="Error Loading NFL Schedule"
          description="Failed to load available NFL weeks for this room's date range. Using default options."
          type="warning"
          showIcon
          style={{ marginBottom: "16px" }}
        />
      )}
      {isOddsFetching && (
        <LoadingSpinner
          message={`Loading ${roomSport === "MLB" ? "MLB" : "NFL"} odds...`}
        />
      )}
      {isOddsError && (
        <div style={{ marginBottom: "16px" }}>
          <ErrorAlert
            title="Error Loading Odds"
            description={
              oddsError?.message ||
              `Failed to load ${roomSport === "MLB" ? "MLB" : "NFL"} odds`
            }
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
          <BettingSummary
            selectedBets={selectedBets}
            nflOdds={memoizedNflOdds}
          />
          <StatusMessages
            oddsCount={memoizedOddsCount}
            selectedWeek={selectedWeek}
            selectedYear={selectedYear}
            selectedSeasonType={selectedSeasonType}
            selectedBetsCount={selectedBetsCount}
            hasDuplicatePoints={hasDuplicatePoints}
            roomSport={roomSport}
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
          <Row gutter={[16, 16]}>
            {memoizedNflOdds.map((game) => {
              const isSelected = !!selectedBets[game.game_id];
              const bet = selectedBets[game.game_id];
              const totalBetsUsed =
                selectedBetsCount + weeklyTakenPoints.length;
              const weeklyPointCounts = weeklyTakenPoints.reduce((acc, p) => {
                acc[p] = (acc[p] || 0) + 1;
                return acc;
              }, {});

              // Check if all point values are at their limits (no available point to assign)
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
                    onSelectSpread={handleSelectSpread}
                    onSelectTotal={handleSelectTotal}
                    onPointsChange={handlePointsChange}
                    roomSport={roomSport}
                    sportRules={sportRules}
                    sessionPointCounts={sessionPointCounts}
                  />
                </Col>
              );
            })}
          </Row>
        </>
      )}
    </Card>
  );
};

export default NFLOddsSection;
