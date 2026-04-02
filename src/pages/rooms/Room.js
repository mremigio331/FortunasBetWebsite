import { useMemo, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, Row, Col, Alert, Button } from "antd";

import { UserAuthenticationContext } from "../../provider/UserAuthenticationProvider";
import { getUserIdFromToken } from "../../utils/authUtils";
import useGetRoom from "../../hooks/room/useGetRoom";
import useGetNFLOdds from "../../hooks/odds/useGetNFLOdds";
import useGetNFLWeeksInRange from "../../hooks/odds/useGetNFLWeeksInRange";
import useCreateBet from "../../hooks/bet/useCreateBet";
import useGetBetsForRoom from "../../hooks/bet/useGetBetsForRoom";
import useGetRoomMembers from "../../hooks/membership/useGetRoomMembers";
import useBetSelection from "../../hooks/room/useBetSelection";
import useNFLWeekSelection from "../../hooks/room/useNFLWeekSelection";
import { getSportBettingRules } from "../../configs/sportConfig";
import RoomInfoSection from "../../components/room/RoomInfoSection";
import RoomHeader from "../../components/room/RoomHeader";
import NFLOddsSection from "../../components/room/NFLOddsSection";
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

  const {
    bets: existingBets,
    isBetsLoading,
    refetch: refetchBets,
  } = useGetBetsForRoom(roomId, room ? room.nfl_weeks : null);

  const nflWeeksData = useGetNFLWeeksInRange(room?.start_date, room?.end_date);

  // NFL week/year/seasonType selection state and options
  const {
    selectedWeek,
    selectedYear,
    selectedSeasonType,
    setSelectedWeek,
    setSelectedYear,
    setSelectedSeasonType,
    weekOptions,
    yearOptions,
    seasonTypeOptions,
    isValidCombination,
    createChangeHandlers,
  } = useNFLWeekSelection({ room, nflWeeksData });

  // Fetch NFL odds based on selected week/year
  const {
    nflOdds,
    oddsCount,
    sport,
    league,
    isOddsFetching,
    isOddsError,
    oddsError,
    oddsRefetch,
    hasOdds,
  } = useGetNFLOdds(selectedWeek, selectedYear, selectedSeasonType);

  // Memoize and sort odds by date
  const memoizedNflOdds = useMemo(() => {
    if (!nflOdds) return [];
    return [...nflOdds].sort((a, b) => new Date(a.date) - new Date(b.date));
  }, [nflOdds]);
  const memoizedOddsCount = useMemo(() => oddsCount, [oddsCount]);

  const roomSport = room?.sport || "NFL";
  const sportRules = useMemo(
    () => getSportBettingRules(roomSport),
    [roomSport],
  );

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
    nflOdds: memoizedNflOdds,
    createBet,
    refetchBets,
  });

  // Week/year/season change handlers that also clear bets
  const changeHandlers = createChangeHandlers(handleClearBets);

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
            isBetsLoading={isBetsLoading}
            bets={existingBets || []}
            members={members || []}
          />
        </Col>
        <Col span={24}>
          <RoomBetsDisplay
            isFetching={isBetsLoading}
            roomId={roomId}
            existingBets={existingBets}
            roomWeeks={room ? room.nfl_weeks : null}
            members={members}
          />
        </Col>
        <Col span={24}>
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
            selectedSeasonType={selectedSeasonType}
            handleSeasonTypeChange={changeHandlers.handleSeasonTypeChange}
            selectedYear={selectedYear}
            handleYearChange={changeHandlers.handleYearChange}
            selectedWeek={selectedWeek}
            handleWeekChange={changeHandlers.handleWeekChange}
            setSelectedWeek={setSelectedWeek}
            setSelectedYear={setSelectedYear}
            setSelectedSeasonType={setSelectedSeasonType}
            weekOptions={weekOptions}
            yearOptions={yearOptions}
            seasonTypeOptions={seasonTypeOptions}
            isValidCombination={isValidCombination}
            currentWeekUserBets={currentWeekUserBets}
            weeklyTakenPoints={weeklyTakenPoints}
            isNFLWeeksError={nflWeeksData.isNFLWeeksError}
            isOddsError={isOddsError}
            oddsError={oddsError}
            hasOdds={hasOdds}
            memoizedNflOdds={memoizedNflOdds}
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
