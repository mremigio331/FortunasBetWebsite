import React, { useState, useMemo, useEffect, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Card,
  Row,
  Col,
  Typography,
  Spin,
  Alert,
  Button,
  Space,
  Divider,
  message,
} from "antd";

import { jwtDecode } from "jwt-decode";
import { UserAuthenticationContext } from "../../provider/UserAuthenticationProvider";
import useGetRoom from "../../hooks/room/useGetRoom";
import useGetNFLOdds from "../../hooks/odds/useGetNFLOdds";
import useGetNFLWeeksInRange from "../../hooks/odds/useGetNFLWeeksInRange";
import useCreateBet from "../../hooks/bet/useCreateBet";
import useGetBetsForRoom from "../../hooks/bet/useGetBetsForRoom";
import { getSeasonTypeOptions } from "../../configs/nflSeasonTypes";
import { getDefaultNFLSelection } from "../../configs/nflCurrentWeek";
import RoomInfoSection from "./Room/RoomInfoSection";
import RoomHeader from "./Room/RoomHeader";
import RoomAdmins from "./Room/RoomAdmins";
import NFLOddsSection from "./Room/NFLOddsSection";
import { createHandlers } from "./Room/roomUtils";
import RoomBetsDisplay from "../../components/room/RoomBetsDisplay";
import MembershipManagement from "../../components/room/MembershipManagement";
import useGetRoomMembers from "../../hooks/membership/useGetRoomMembers";

const { Text, Paragraph } = Typography;

const Room = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { idToken } = useContext(UserAuthenticationContext);

  // State for betting selections
  const [selectedBets, setSelectedBets] = useState({});
  // Count of selected bets
  const selectedBetsCount = Object.keys(selectedBets).length;
  // Handlers for bet actions
  const handlers = createHandlers({
    setSelectedWeek,
    setSelectedYear,
    setSelectedSeasonType,
    setSelectedBets,
    seasonTypeOptions,
  });

  const { room, isRoomFetching, isRoomError, roomError, roomRefetch } =
    useGetRoom(roomId);

  // Get current user ID and check if they're an admin
  const currentUserId = useMemo(() => {
    if (!idToken) return null;
    try {
      return jwtDecode(idToken).sub;
    } catch (error) {
      console.error("Failed to decode token:", error);
      return null;
    }
  }, [idToken]);

  const isCurrentUserAdmin = useMemo(() => {
    if (!room || !currentUserId) return false;
    // Check both possible field names for backward compatibility
    const adminIds = room.admin_user_ids || room.admins || [];
    const isAdmin = adminIds.includes(currentUserId);

    console.log("Admin Check Debug:", {
      roomId,
      currentUserId,
      adminIds,
      isAdmin,
      room_admin_user_ids: room.admin_user_ids,
      room_admins: room.admins,
    });

    return isAdmin;
  }, [room, currentUserId, roomId]);

  const { members, isMembersFetching } = useGetRoomMembers(roomId);

  const isMember = useMemo(() => {
    if (!currentUserId || !Array.isArray(members)) return false;
    return members.some(
      (m) => m.user_id === currentUserId && m.status === "approved",
    );
  }, [members, currentUserId]);

  const isMembershipFetching = isMembersFetching;

  // Bet creation hook
  const { createBet, isLoading: isBetCreating } = useCreateBet();

  // Get existing bets for the room to check weekly constraints
  const {
    bets: existingBets,
    users: existingBetsUsers,
    betsCount,
    isFetching: isBetsFetching,
    isError: isBetsError,
    refetch: refetchBets,
  } = useGetBetsForRoom(roomId);

  // Get NFL weeks available in the room's date range
  const {
    nflWeeks,
    availableSeasons,
    getSeasonTypesForYear,
    getWeeksForYearAndSeason,
    isValidCombination,
    getDefaultSelection,
    isNFLWeeksFetching,
    isNFLWeeksError,
  } = useGetNFLWeeksInRange(room?.start_date, room?.end_date);

  // Get default selection or use current values (stable initialization)
  const defaultSelection = useMemo(() => {
    // First try to get from NFL weeks data based on room dates
    if (
      room?.start_date &&
      room?.end_date &&
      nflWeeks?.length &&
      getDefaultSelection
    ) {
      const roomBasedDefault = getDefaultSelection();
      if (roomBasedDefault) {
        return roomBasedDefault;
      }
    }

    // Fallback to current NFL week based on today's date
    const currentNFLWeek = getDefaultNFLSelection();
    return {
      year: currentNFLWeek.year,
      seasonType: currentNFLWeek.seasonType,
      week: currentNFLWeek.week,
    };
  }, [room?.start_date, room?.end_date, nflWeeks, getDefaultSelection]);

  // State for NFL odds selection - initialize once with default selection
  const [selectedWeek, setSelectedWeek] = useState(() => defaultSelection.week);
  const [selectedYear, setSelectedYear] = useState(() => defaultSelection.year);
  const [selectedSeasonType, setSelectedSeasonType] = useState(
    () => defaultSelection.seasonType,
  );

  // Only update if we don't have valid initial values (first load only)
  useEffect(() => {
    if (!selectedWeek || !selectedYear || !selectedSeasonType) {
      setSelectedWeek(defaultSelection.week);
      setSelectedYear(defaultSelection.year);
      setSelectedSeasonType(defaultSelection.seasonType);
    }
  }, [defaultSelection, selectedWeek, selectedYear, selectedSeasonType]);

  // Ensure selected season type is valid for current options
  useEffect(() => {
    if (seasonTypeOptions.length > 0) {
      const hasValidSeasonType = seasonTypeOptions.some(
        (option) => option.value === selectedSeasonType,
      );
      if (!hasValidSeasonType) {
        // Default to first available season type
        setSelectedSeasonType(seasonTypeOptions[0].value);
      }
    }
  }, [seasonTypeOptions, selectedSeasonType]);

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

  // Memoize the odds data to prevent unnecessary re-renders
  const memoizedNflOdds = useMemo(() => nflOdds, [nflOdds]);
  const memoizedOddsCount = useMemo(() => oddsCount, [oddsCount]);

  // Generate dynamic options based on room's NFL weeks
  const weekOptions = useMemo(() => {
    if (!room?.start_date || !room?.end_date || !getWeeksForYearAndSeason)
      return [];
    return getWeeksForYearAndSeason(selectedYear, selectedSeasonType);
  }, [
    selectedYear,
    selectedSeasonType,
    room?.start_date,
    room?.end_date,
    getWeeksForYearAndSeason,
  ]);

  // Generate year options from available seasons
  const yearOptions = useMemo(() => {
    if (!availableSeasons?.length) return [new Date().getFullYear()];
    return availableSeasons.map((season) => season.year).sort((a, b) => a - b);
  }, [availableSeasons]);

  // Generate season type options for selected year
  const seasonTypeOptions = useMemo(() => {
    if (!room?.start_date || !room?.end_date || !getSeasonTypesForYear) {
      // Use config fallback when NFL weeks data isn't available
      return getSeasonTypeOptions();
    }

    const seasonTypes = getSeasonTypesForYear(selectedYear);
    if (!seasonTypes || seasonTypes.length === 0) {
      // Fallback to config if no dynamic data
      return getSeasonTypeOptions();
    }

    return seasonTypes.map((st) => ({
      value: st.seasonType,
      label: st.displayName,
    }));
  }, [selectedYear, room?.start_date, room?.end_date, getSeasonTypesForYear]);

  const handleGoBack = () => {
    navigate(-1);
  };

  // Memoized handlers from roomUtils
  // ...existing code...

  const handleClearBets = useMemo(
    () => () => {
      setSelectedBets({});
    },
    [],
  );

  const handleSubmitBets = useMemo(
    () => async () => {
      const betEntries = Object.entries(selectedBets);
      if (betEntries.length === 0) {
        message.warning("Please select at least one game to bet on");
        return;
      }

      if (hasDuplicatePoints) {
        // Determine if conflicts are from session duplicates or weekly taken points
        const sessionDuplicates = duplicatePointValues.filter(
          (point) =>
            Object.values(selectedBets).filter((bet) => bet.points === point)
              .length > 1,
        );
        const weeklyConflicts = duplicatePointValues.filter(
          (point) =>
            weeklyTakenPoints.includes(point) &&
            Object.values(selectedBets).some((bet) => bet.points === point),
        );

        let errorMessage = "Cannot place bets:";
        if (sessionDuplicates.length > 0) {
          errorMessage += ` Point values ${sessionDuplicates.join(", ")} are used multiple times in this session.`;
        }
        if (weeklyConflicts.length > 0) {
          errorMessage += ` Point values ${weeklyConflicts.join(", ")} were already used this week.`;
        }
        errorMessage += " Please adjust your selections.";

        message.error(errorMessage);
        return;
      }

      try {
        // Submit each bet individually
        const betPromises = betEntries.map(async ([gameId, bet]) => {
          const game = memoizedNflOdds.find((g) => g.game_id === gameId);
          if (!game) {
            throw new Error(`Game not found: ${gameId}`);
          }

          // Determine the bet choice based on bet type
          let teamChoice = null;
          let overUnderChoice = null;

          if (bet.betType === "spread") {
            teamChoice = bet.teamChoice; // "home" or "away"
          } else {
            overUnderChoice = bet.teamChoice; // "over" or "under"
          }

          // Create the game_bet object
          const gameBet = {
            game_id: gameId,
            bet_type: bet.betType === "overUnder" ? "over_under" : bet.betType,
            points_wagered: bet.points,
            ...(teamChoice && { team_choice: teamChoice }),
            ...(overUnderChoice && { over_under_choice: overUnderChoice }),
            ...(bet.betType === "spread" && {
              spread_value:
                bet.teamChoice === "home" ? game.homeSpread : game.awaySpread,
            }),
            ...(bet.betType === "overUnder" && { total_value: game.overUnder }),
          };

          // Ensure event_datetime is properly converted to epoch timestamp (seconds)
          let eventDateTime;
          if (!game.date || game.date === null) {
            throw new Error(
              `Game ${gameId} is missing date - cannot place bet`,
            );
          }

          try {
            const gameDate = new Date(game.date);
            if (isNaN(gameDate.getTime())) {
              throw new Error(`Game ${gameId} has invalid date: ${game.date}`);
            }
            eventDateTime = Math.floor(gameDate.getTime() / 1000);
          } catch (error) {
            if (error.message.includes("date")) {
              throw error; // Re-throw our custom error
            }
            throw new Error(
              `Failed to parse date for game ${gameId}: ${game.date}`,
            );
          }

          return createBet({
            room_id: roomId,
            game_id: gameId,
            sport: sport || "football", // Use sport from odds response, fallback to football
            league: league || "nfl", // Use league from odds response, fallback to nfl
            season_type: parseInt(selectedSeasonType), // Ensure it's an integer
            week: selectedWeek, // Add week field
            event_datetime: eventDateTime, // Epoch timestamp in seconds
            game_bet: gameBet,
            odds_snapshot: game, // Full game data as odds snapshot
          });
        });

        await Promise.all(betPromises);

        message.success(
          `Successfully placed ${betEntries.length} bet${betEntries.length !== 1 ? "s" : ""}!`,
        );

        // Refresh bets to update weekly constraints
        refetchBets();

        // Clear the selected bets after successful submission
        setSelectedBets({});
      } catch (error) {
        // Error handling is done by the useCreateBet hook
        console.error("Error submitting bets:", error);
      }
    },
    [
      selectedBets,
      hasDuplicatePoints,
      memoizedNflOdds,
      roomId,
      createBet,
      selectedSeasonType,
      sport,
      league,
    ],
  );

  // Get selected bets count and total points (memoized)
  // ...existing code...
  const totalPoints = useMemo(
    () =>
      Object.values(selectedBets).reduce(
        (sum, bet) => sum + (bet?.points ?? 0),
        0,
      ),
    [selectedBets],
  );

  // Get current user's bets for the selected week (memoized)
  const currentWeekUserBets = useMemo(() => {
    if (!existingBets || !Array.isArray(existingBets) || !currentUserId) {
      return [];
    }

    // Filter bets for current user, current week, season type, sport, and league
    return existingBets.filter((bet) => {
      return (
        bet.user_id === currentUserId &&
        bet.week === selectedWeek &&
        bet.season_type === parseInt(selectedSeasonType) &&
        bet.sport === (sport || "football") &&
        bet.league === (league || "nfl") &&
        new Date(bet.event_datetime * 1000).getFullYear() === selectedYear
      );
    });
  }, [
    existingBets,
    currentUserId,
    selectedWeek,
    selectedSeasonType,
    selectedYear,
    sport,
    league,
  ]);

  // Get weekly taken points to disable in UI
  const weeklyTakenPoints = useMemo(() => {
    return currentWeekUserBets.map((bet) => bet.points_wagered);
  }, [currentWeekUserBets]);

  // Check for duplicate point values (memoized)
  const { hasDuplicatePoints, duplicatePointValues } = useMemo(() => {
    const pointCounts = Object.values(selectedBets).reduce((acc, bet) => {
      acc[bet.points] = (acc[bet.points] || 0) + 1;
      return acc;
    }, {});

    const hasDups = Object.values(pointCounts).some((count) => count > 1);
    const dupValues = Object.entries(pointCounts)
      .filter(([_, count]) => count > 1)
      .map(([points, _]) => parseInt(points));

    // Check if any selected bets conflict with weekly taken points
    const weeklyConflicts = Object.values(selectedBets)
      .map((bet) => bet.points)
      .filter((points) => weeklyTakenPoints.includes(points));

    // Combine session duplicates with weekly taken points for UI disabling
    const allConflictingPoints = [
      ...new Set([...dupValues, ...weeklyTakenPoints]),
    ];

    return {
      hasDuplicatePoints: hasDups || weeklyConflicts.length > 0,
      duplicatePointValues: allConflictingPoints,
    };
  }, [selectedBets, weeklyTakenPoints]);

  if (isRoomFetching || (room && isNFLWeeksFetching)) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "400px",
        }}
      >
        <Spin size="large" />
        <div style={{ marginLeft: "16px" }}>
          <Text>
            {isRoomFetching ? "Loading room..." : "Loading NFL schedule..."}
          </Text>
        </div>
      </div>
    );
  }

  if (isRoomError) {
    return (
      <div style={{ padding: "24px" }}>
        <Alert
          message="Error Loading Room"
          description={roomError?.message || "Failed to load room information"}
          type="error"
          showIcon
          action={
            <Space>
              <Button size="small" onClick={roomRefetch}>
                Retry
              </Button>
              <Button size="small" onClick={handleGoBack}>
                Go Back
              </Button>
            </Space>
          }
        />
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
              onRequestMembership={() => {
                /* TODO: implement request membership logic */
              }}
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
          <RoomBetsDisplay roomId={roomId} />
        </Col>
        <Col span={24}>
          <NFLOddsSection
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
            handleSeasonTypeChange={handlers.handleSeasonTypeChange}
            selectedYear={selectedYear}
            handleYearChange={handlers.handleYearChange}
            selectedWeek={selectedWeek}
            handleWeekChange={handlers.handleWeekChange}
            setSelectedWeek={setSelectedWeek}
            setSelectedYear={setSelectedYear}
            setSelectedSeasonType={setSelectedSeasonType}
            weekOptions={weekOptions}
            yearOptions={yearOptions}
            seasonTypeOptions={seasonTypeOptions}
            isValidCombination={isValidCombination}
            currentWeekUserBets={currentWeekUserBets}
            weeklyTakenPoints={weeklyTakenPoints}
            isNFLWeeksError={isNFLWeeksError}
            isOddsError={isOddsError}
            oddsError={oddsError}
            hasOdds={hasOdds}
            memoizedNflOdds={memoizedNflOdds}
            memoizedOddsCount={memoizedOddsCount}
            isBetCreating={isBetCreating}
            duplicatePointValues={duplicatePointValues}
            handleGameSelect={handlers.handleGameSelect(
              selectedBets,
              setSelectedBets,
            )}
            handleBetTypeChange={handlers.handleBetTypeChange(
              selectedBets,
              setSelectedBets,
            )}
            handleTeamChoiceChange={handlers.handleTeamChoiceChange(
              selectedBets,
              setSelectedBets,
            )}
            handlePointsChange={handlers.handlePointsChange(
              selectedBets,
              setSelectedBets,
            )}
            memberships={members}
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
