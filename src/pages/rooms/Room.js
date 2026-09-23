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
import useCurrentWeek, {
  MLB_SEASON_TYPE,
} from "../../hooks/room/useCurrentWeek";
import useNFLWeekSelection from "../../hooks/room/useNFLWeekSelection";
import useMLBWeekSelection from "../../hooks/room/useMLBWeekSelection";
import { getSportBettingRules } from "../../configs/sportConfig";
import { getEasternDateParts } from "../../utils/easternTime";
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

  // --- Room week ranges (one per sport; the other stays disabled) ---
  const nflWeeksData = useGetNFLWeeksInRange(
    !isMLB ? room?.start_date : null,
    !isMLB ? room?.end_date : null,
  );

  const mlbWeeksData = useGetMLBWeeksInRange(
    isMLB ? room?.start_date : null,
    isMLB ? room?.end_date : null,
  );

  /**
   * The Current_Week, from the single source of truth (Requirement 7.3). This
   * page does not compute "which week is it" anywhere else — no date math here,
   * no direct use of the Fallback_Week_Source.
   *
   * `mlbWeeksData` is handed in so an MLB room resolves against the range it has
   * already fetched instead of issuing a second identical request.
   */
  const {
    currentWeek: resolvedCurrentWeek,
    isLoading: isCurrentWeekLoading,
    isEstimate: isCurrentWeekEstimate,
    isOffSeason: isCurrentWeekOffSeason,
  } = useCurrentWeek(roomSport, {
    room,
    mlbWeeksData,
    enabled: Boolean(room),
  });

  // The resolution belongs to one sport at a time; do not leak it across.
  const nflCurrentWeek = isMLB ? null : resolvedCurrentWeek;
  const mlbCurrentWeek = isMLB ? resolvedCurrentWeek : null;

  // --- NFL hooks (only active for NFL rooms) ---
  const {
    selectedWeek: nflSelectedWeek,
    selectedYear: nflSelectedYear,
    selectedSeasonType: nflSelectedSeasonType,
    weekOptions: nflWeekOptions,
    yearOptions: nflYearOptions,
    seasonTypeOptions: nflSeasonTypeOptions,
    createChangeHandlers: nflCreateChangeHandlers,
    isWeekLoading: isNFLWeekLoading,
    isWeekEstimate: isNFLWeekEstimate,
    isCurrentWeekOutOfRange: isNFLCurrentWeekOutOfRange,
    isOffSeason: isNFLOffSeason,
  } = useNFLWeekSelection({
    room: !isMLB ? room : null,
    nflWeeksData,
    currentWeek: nflCurrentWeek,
    isCurrentWeekLoading: !isMLB && isCurrentWeekLoading,
    isCurrentWeekEstimate: !isMLB && isCurrentWeekEstimate,
    isOffSeason: !isMLB && isCurrentWeekOffSeason,
  });

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
  const {
    selectedWeekNumber: mlbSelectedWeekNumber,
    selectedWeek: mlbSelectedWeek,
    weekOptions: mlbWeekOptions,
    createChangeHandlers: mlbCreateChangeHandlers,
    isWeekLoading: isMLBWeekLoading,
    isWeekEstimate: isMLBWeekEstimate,
    isCurrentWeekOutOfRange: isMLBCurrentWeekOutOfRange,
    isOffSeason: isMLBOffSeason,
  } = useMLBWeekSelection({
    room: isMLB ? room : null,
    mlbWeeksData,
    currentWeek: mlbCurrentWeek,
    isCurrentWeekLoading: isMLB && isCurrentWeekLoading,
    isCurrentWeekEstimate: isMLB && isCurrentWeekEstimate,
    isOffSeason: isMLB && isCurrentWeekOffSeason,
  });

  /**
   * For MLB the Current_Week is derived from the room's own week range, so
   * `useCurrentWeek.isEstimate` means exactly one thing: no week in this room
   * contains the present moment. That is the out-of-range case (Requirement 1.6),
   * not a "we guessed" estimate, and the page should say so.
   */
  const isMLBWeekOutOfRange =
    isMLBCurrentWeekOutOfRange || (isMLB && isCurrentWeekEstimate);

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

  const selectedSeasonType = isMLB ? MLB_SEASON_TYPE : nflSelectedSeasonType;

  // The MLB season year is the ET calendar year of the selected week's Monday.
  // Browser-local accessors would disagree by a day for viewers west of ET
  // (Requirement 3.5); `resolvedCurrentWeek.year` covers the pre-selection frame.
  const mlbSelectedYear = useMemo(() => {
    if (mlbSelectedWeek) {
      const parts = getEasternDateParts(new Date(mlbSelectedWeek.start * 1000));
      if (parts) return parts.year;
    }
    return mlbCurrentWeek?.year ?? null;
  }, [mlbSelectedWeek, mlbCurrentWeek]);

  const selectedYear = isMLB ? mlbSelectedYear : nflSelectedYear;
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
    handleSelectSpread,
    handleSelectTotal,
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
              isWeekLoading={isMLBWeekLoading}
              isWeekEstimate={isMLBWeekEstimate}
              isCurrentWeekOutOfRange={isMLBWeekOutOfRange}
              isOffSeason={isMLBOffSeason}
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
              handleSelectSpread={handleSelectSpread}
              handleSelectTotal={handleSelectTotal}
              handlePointsChange={handlePointsChange}
              roomSport={roomSport}
              sportRules={sportRules}
              selectedWeek={mlbSelectedWeek}
            />
          ) : (
            <NFLOddsSection
              isNFLWeeksFetching={nflWeeksData.isNFLWeeksFetching}
              isWeekLoading={isNFLWeekLoading}
              isWeekEstimate={isNFLWeekEstimate}
              isCurrentWeekOutOfRange={isNFLCurrentWeekOutOfRange}
              isOffSeason={isNFLOffSeason}
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
              weekOptions={nflWeekOptions}
              yearOptions={nflYearOptions}
              seasonTypeOptions={nflSeasonTypeOptions}
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
              handleSelectSpread={handleSelectSpread}
              handleSelectTotal={handleSelectTotal}
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
