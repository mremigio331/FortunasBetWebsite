import React, { useMemo, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, Row, Col, Alert, Button } from "antd";

import { UserAuthenticationContext } from "../../provider/UserAuthenticationProvider";
import { getUserIdFromToken } from "../../utils/authUtils";
import useGetRoom from "../../hooks/room/useGetRoom";
import useGetNFLOdds from "../../hooks/odds/useGetNFLOdds";
import useGetMLBOdds from "../../hooks/odds/useGetMLBOdds";
import useGetNFLWeeksInRange from "../../hooks/odds/useGetNFLWeeksInRange";
import useGetMLBWeeksInRange from "../../hooks/odds/useGetMLBWeeksInRange";
import useCreateBet from "../../hooks/bet/useCreateBet";
import useGetBetsForRoom from "../../hooks/bet/useGetBetsForRoom";
import useGetRemovedBets from "../../hooks/bet/useGetRemovedBets";
import useGetRoomMembers from "../../hooks/membership/useGetRoomMembers";
import useGetRoomLeaderboard from "../../hooks/room/useGetRoomLeaderboard";
import useGetRoomBetsAll from "../../hooks/room/useGetRoomBetsAll";
import useBetSelection from "../../hooks/room/useBetSelection";
import useNFLWeekSelection from "../../hooks/room/useNFLWeekSelection";
import useMLBWeekSelection from "../../hooks/room/useMLBWeekSelection";
import { getSportBettingRules } from "../../configs/sportConfig";
import RoomInfoSection from "../../components/room/RoomInfoSection";
import RoomHeader from "../../components/room/RoomHeader";
import NFLOddsSection from "../../components/room/NFLOddsSection";
import MLBOddsSection from "../../components/room/MLBOddsSection";
import RoomBetsDisplay from "../../components/room/RoomBetsDisplay";
import RoomLeaderboard from "../../components/room/RoomLeaderboard";
import LoadingSpinner from "../../components/shared/LoadingSpinner";
import ErrorAlert from "../../components/shared/ErrorAlert";
import MembershipManagement from "../../components/room/MembershipManagement";

const Room = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { idToken } = useContext(UserAuthenticationContext);

  const currentUserId = useMemo(() => getUserIdFromToken(idToken), [idToken]);

  const { room, isRoomFetching, isRoomError, roomError, roomRefetch } =
    useGetRoom(roomId);

  const isCurrentUserAdmin = useMemo(() => {
    if (!room || !currentUserId) return false;
    const adminIds = room.admin_user_ids || room.admins || [];
    return adminIds.includes(currentUserId);
  }, [room, currentUserId]);

  const { members, isMembersFetching } = useGetRoomMembers(roomId);
  const isMembershipFetching = isMembersFetching;

  const isMember = useMemo(() => {
    if (!currentUserId || !Array.isArray(members)) return false;
    return members.some(
      (m) => m.user_id === currentUserId && m.status === "approved",
    );
  }, [members, currentUserId]);

  const { createBet, isLoading: isBetCreating } = useCreateBet();

  const { removedBets, refetchRemovedBets } = useGetRemovedBets(roomId, !!room);

  // --- New server-computed hooks (independent of bets/weeks) ---
  const { leaderboard, isLeaderboardLoading, refetchLeaderboard } =
    useGetRoomLeaderboard(roomId, !!room);

  const {
    bets: roomBetsAll,
    users: roomBetsUsers,
    isBetsLoading: isRoomBetsAllLoading,
    refetchBets: refetchRoomBetsAll,
  } = useGetRoomBetsAll(roomId, !!room);

  const roomSport = room?.sport || "NFL";
  const isMLB = roomSport === "MLB";
  const sportRules = useMemo(
    () => getSportBettingRules(roomSport),
    [roomSport],
  );

  // --- NFL hooks (only active for NFL rooms) ---
  const nflWeeksData = useGetNFLWeeksInRange(
    !isMLB ? room?.start_date : null,
    !isMLB ? room?.end_date : null,
  );

  const {
    selectedWeek: nflSelectedWeek,
    selectedYear: nflSelectedYear,
    selectedSeasonType: nflSelectedSeasonType,
    setSelectedWeek: nflSetSelectedWeek,
    setSelectedYear: nflSetSelectedYear,
    setSelectedSeasonType: nflSetSelectedSeasonType,
    weekOptions: nflWeekOptions,
    yearOptions: nflYearOptions,
    seasonTypeOptions: nflSeasonTypeOptions,
    isValidCombination: nflIsValidCombination,
    createChangeHandlers: nflCreateChangeHandlers,
  } = useNFLWeekSelection({ room: !isMLB ? room : null, nflWeeksData });

  const {
    nflOdds,
    oddsCount: nflOddsCount,
    sport: nflSport,
    league: nflLeague,
    isOddsFetching: isNFLOddsFetching,
    isOddsError: isNFLOddsError,
    oddsError: nflOddsError,
    oddsRefetch: nflOddsRefetch,
    hasOdds: nflHasOdds,
  } = useGetNFLOdds(
    nflSelectedWeek,
    nflSelectedYear,
    nflSelectedSeasonType,
    !isMLB,
  );

  // --- MLB hooks (only active for MLB rooms) ---
  const mlbWeeksData = useGetMLBWeeksInRange(
    isMLB ? room?.start_date : null,
    isMLB ? room?.end_date : null,
  );

  const {
    selectedWeekNumber: mlbSelectedWeekNumber,
    setSelectedWeekNumber: mlbSetSelectedWeekNumber,
    selectedWeek: mlbSelectedWeek,
    selectedDate: mlbSelectedDate,
    weekOptions: mlbWeekOptions,
    createChangeHandlers: mlbCreateChangeHandlers,
  } = useMLBWeekSelection({ room: isMLB ? room : null, mlbWeeksData });

  const {
    mlbOdds,
    oddsByDay: mlbOddsByDay,
    oddsCount: mlbOddsCount,
    isOddsFetching: isMLBOddsFetching,
    isOddsError: isMLBOddsError,
    oddsError: mlbOddsError,
    oddsRefetch: mlbOddsRefetch,
    hasOdds: mlbHasOdds,
  } = useGetMLBOdds(
    mlbSelectedWeek?.start ?? null,
    mlbSelectedWeek?.end ?? null,
    isMLB,
  );

  // --- Unified values for bet selection ---
  const selectedWeek = isMLB ? mlbSelectedWeekNumber : nflSelectedWeek;

  // Fetch bets for room — NFL uses nfl_weeks, MLB uses availableWeeks with start/end epochs
  const {
    bets: existingBets,
    isBetsLoading,
    refetchBets,
  } = useGetBetsForRoom(
    roomId,
    !isMLB && room ? room.nfl_weeks : null,
    true,
    isMLB ? mlbWeeksData.availableWeeks : null,
  );

  const selectedSeasonType = isMLB ? 2 : nflSelectedSeasonType;
  const selectedYear = isMLB
    ? mlbSelectedWeek
      ? new Date(mlbSelectedWeek.start * 1000).getFullYear()
      : new Date().getFullYear()
    : nflSelectedYear;
  const sport = isMLB ? "baseball" : nflSport || "football";
  const league = isMLB ? "mlb" : nflLeague || "nfl";

  const rawOdds = isMLB ? mlbOdds : nflOdds;
  const memoizedOdds = useMemo(() => {
    if (!rawOdds) return [];
    return [...rawOdds].sort((a, b) => new Date(a.date) - new Date(b.date));
  }, [rawOdds]);
  const memoizedOddsCount = useMemo(
    () => (isMLB ? mlbOddsCount : nflOddsCount),
    [isMLB, mlbOddsCount, nflOddsCount],
  );

  const isOddsFetching = isMLB ? isMLBOddsFetching : isNFLOddsFetching;
  const isOddsError = isMLB ? isMLBOddsError : isNFLOddsError;
  const oddsError = isMLB ? mlbOddsError : nflOddsError;
  const oddsRefetch = isMLB ? mlbOddsRefetch : nflOddsRefetch;
  const hasOdds = isMLB ? mlbHasOdds : nflHasOdds;

  // Bet selection state, derived values, and handlers
  const {
    selectedBets,
    selectedBetsCount,
    totalPoints,
    currentWeekUserBets,
    weeklyTakenPoints,
    hasDuplicatePoints,
    duplicatePointValues,
    sessionPointCounts,
    handleClearBets,
    handleGameSelect,
    handleBetTypeChange,
    handleTeamChoiceChange,
    handlePointsChange,
    handleSubmitBets,
  } = useBetSelection({
    roomId,
    currentUserId,
    existingBets,
    selectedWeek,
    selectedSeasonType,
    selectedYear,
    sport,
    league,
    roomSport,
    nflOdds: memoizedOdds,
    createBet,
    refetchBets,
  });

  // Change handlers that also clear bets
  const nflChangeHandlers = nflCreateChangeHandlers(handleClearBets);
  const mlbChangeHandlers = mlbCreateChangeHandlers(handleClearBets);

  const handleGoBack = () => navigate(-1);

  if (isRoomFetching) {
    return (
      <div
        style={{
          minHeight: "400px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <LoadingSpinner message="Loading room..." />
      </div>
    );
  }

  if (isRoomError) {
    return (
      <div style={{ padding: "24px" }}>
        <ErrorAlert
          title="Error Loading Room"
          description={roomError?.message || "Failed to load room information"}
          onRetry={roomRefetch}
        />
        <Button
          size="small"
          onClick={handleGoBack}
          style={{ marginTop: "8px" }}
        >
          Go Back
        </Button>
      </div>
    );
  }

  if (!room) {
    return (
      <div style={{ padding: "24px" }}>
        <Alert
          message="Room Not Found"
          description="The room you're looking for doesn't exist or you don't have access to it"
          type="warning"
          showIcon
          action={
            <Button size="small" onClick={handleGoBack}>
              Go Back
            </Button>
          }
        />
      </div>
    );
  }

  // Private room: show header + access message only
  if (!room.public && !isMember) {
    return (
      <div style={{ padding: "24px", maxWidth: "1200px", margin: "0 auto" }}>
        <Row gutter={[24, 24]}>
          <Col span={24}>
            <Card style={{ marginBottom: 24, boxShadow: "0 2px 8px #f0f1f2" }}>
              <RoomHeader
                room={room}
                isMember={isMember}
                isMembershipFetching={isMembershipFetching}
                currentUserId={currentUserId}
                members={members}
                isCurrentUserAdmin={isCurrentUserAdmin}
              />
            </Card>
          </Col>
          <Col span={24}>
            <Card>
              <div
                style={{ textAlign: "center", padding: "40px 0", fontSize: 18 }}
              >
                This is a private room. You must join and be accepted in the
                room to view more details.
              </div>
            </Card>
          </Col>
        </Row>
      </div>
    );
  }

  // Full room content
  return (
    <div style={{ padding: "24px", maxWidth: "1200px", margin: "0 auto" }}>
      <Row gutter={[24, 24]}>
        <Col span={24}>
          <Card style={{ marginBottom: 24, boxShadow: "0 2px 8px #f0f1f2" }}>
            <RoomHeader
              room={room}
              isMember={isMember}
              isMembershipFetching={isMembershipFetching}
              currentUserId={currentUserId}
              members={members}
            />
          </Card>
        </Col>
        <Col span={24}>
          <Card>
            <Row gutter={[24, 24]}>
              <RoomInfoSection room={room} />
            </Row>
          </Card>
        </Col>
        <Col span={24}>
          <RoomLeaderboard
            isLoading={isLeaderboardLoading}
            leaderboard={leaderboard}
          />
        </Col>
        <Col span={24}>
          <RoomBetsDisplay
            isFetching={isRoomBetsAllLoading}
            roomId={roomId}
            existingBets={roomBetsAll}
            roomWeeks={room ? room.nfl_weeks : null}
            members={members}
            users={roomBetsUsers}
            roomSport={roomSport}
            refetchBets={() => {
              refetchRoomBetsAll();
              refetchLeaderboard();
              refetchBets();
              refetchRemovedBets();
            }}
            removedBets={removedBets}
          />
        </Col>
        <Col span={24}>
          {isMLB ? (
            <MLBOddsSection
              isMLBWeeksFetching={mlbWeeksData.isMLBWeeksFetching}
              selectedBets={selectedBets}
              selectedBetsCount={selectedBetsCount}
              handleSubmitBets={handleSubmitBets}
              totalPoints={totalPoints}
              handleClearBets={handleClearBets}
              oddsRefetch={oddsRefetch}
              isOddsFetching={isOddsFetching}
              isCurrentUserAdmin={isCurrentUserAdmin}
              isMember={isMember}
              hasDuplicatePoints={hasDuplicatePoints}
              isMembershipFetching={isMembershipFetching}
              selectedWeekNumber={mlbSelectedWeekNumber}
              handleWeekChange={mlbChangeHandlers.handleWeekChange}
              weekOptions={mlbWeekOptions}
              currentWeekUserBets={currentWeekUserBets}
              weeklyTakenPoints={weeklyTakenPoints}
              isMLBWeeksError={mlbWeeksData.isMLBWeeksError}
              isOddsError={isOddsError}
              oddsError={oddsError}
              hasOdds={hasOdds}
              memoizedOdds={memoizedOdds}
              memoizedOddsCount={memoizedOddsCount}
              oddsByDay={mlbOddsByDay}
              isBetCreating={isBetCreating}
              duplicatePointValues={duplicatePointValues}
              sessionPointCounts={sessionPointCounts}
              handleGameSelect={handleGameSelect}
              handleBetTypeChange={handleBetTypeChange}
              handleTeamChoiceChange={handleTeamChoiceChange}
              handlePointsChange={handlePointsChange}
              roomSport={roomSport}
              sportRules={sportRules}
              selectedWeek={mlbSelectedWeek}
            />
          ) : (
            <NFLOddsSection
              isNFLWeeksFetching={nflWeeksData.isNFLWeeksFetching}
              selectedBets={selectedBets}
              selectedBetsCount={selectedBetsCount}
              handleSubmitBets={handleSubmitBets}
              totalPoints={totalPoints}
              handleClearBets={handleClearBets}
              oddsRefetch={oddsRefetch}
              isOddsFetching={isOddsFetching}
              isCurrentUserAdmin={isCurrentUserAdmin}
              isMember={isMember}
              hasDuplicatePoints={hasDuplicatePoints}
              isMembershipFetching={isMembershipFetching}
              selectedSeasonType={nflSelectedSeasonType}
              handleSeasonTypeChange={nflChangeHandlers.handleSeasonTypeChange}
              selectedYear={nflSelectedYear}
              handleYearChange={nflChangeHandlers.handleYearChange}
              selectedWeek={nflSelectedWeek}
              handleWeekChange={nflChangeHandlers.handleWeekChange}
              setSelectedWeek={nflSetSelectedWeek}
              setSelectedYear={nflSetSelectedYear}
              setSelectedSeasonType={nflSetSelectedSeasonType}
              weekOptions={nflWeekOptions}
              yearOptions={nflYearOptions}
              seasonTypeOptions={nflSeasonTypeOptions}
              isValidCombination={nflIsValidCombination}
              currentWeekUserBets={currentWeekUserBets}
              weeklyTakenPoints={weeklyTakenPoints}
              isNFLWeeksError={nflWeeksData.isNFLWeeksError}
              isOddsError={isOddsError}
              oddsError={oddsError}
              hasOdds={hasOdds}
              memoizedNflOdds={memoizedOdds}
              memoizedOddsCount={memoizedOddsCount}
              isBetCreating={isBetCreating}
              duplicatePointValues={duplicatePointValues}
              sessionPointCounts={sessionPointCounts}
              handleGameSelect={handleGameSelect}
              handleBetTypeChange={handleBetTypeChange}
              handleTeamChoiceChange={handleTeamChoiceChange}
              handlePointsChange={handlePointsChange}
              existingBets={existingBets}
              members={members}
              roomSport={roomSport}
              sportRules={sportRules}
            />
          )}
        </Col>
        {isCurrentUserAdmin && (
          <Col span={24}>
            <MembershipManagement roomId={roomId} idToken={idToken} />
          </Col>
        )}
      </Row>
    </div>
  );
};

export default Room;
