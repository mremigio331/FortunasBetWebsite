import { useContext, useMemo } from "react";
import { UserAuthenticationContext } from "../../provider/UserAuthenticationProvider";
import { getUserIdFromToken } from "../../utils/authUtils";
import { getSportBettingRules } from "../../configs/sportConfig";
import { getEasternDateParts } from "../../utils/easternTime";

import useGetRoom from "./useGetRoom";
import useGetRoomMembers from "../membership/useGetRoomMembers";
import useGetRoomLeaderboard from "./useGetRoomLeaderboard";
import useGetRoomBetsAll from "./useGetRoomBetsAll";
import useGetRemovedBets from "../bet/useGetRemovedBets";
import useCreateBet from "../bet/useCreateBet";
import useGetBetsForRoom from "../bet/useGetBetsForRoom";
import useGetNFLWeeksInRange from "../odds/useGetNFLWeeksInRange";
import useGetMLBWeeksInRange from "../odds/useGetMLBWeeksInRange";
import useGetSlateWithOdds from "../games/useGetSlateWithOdds";
import useGetMLBOdds from "../odds/useGetMLBOdds";
import useCurrentWeek, { MLB_SEASON_TYPE } from "./useCurrentWeek";
import useNFLWeekSelection from "./useNFLWeekSelection";
import useMLBWeekSelection from "./useMLBWeekSelection";
import useBetSelection from "./useBetSelection";

/**
 * Orchestrates all data and derived state for a room: the room record,
 * membership, leaderboard, bets, week ranges, current-week resolution,
 * sport-specific week selection, odds/slate, and bet selection.
 *
 * This is the single data source for the Room page and RoomProvider. It exists
 * to keep the page component focused on layout: everything here used to live
 * inline in Room.js. The returned shape groups values by concern (room,
 * standings, placeBets) plus the two prebuilt odds-section prop bags the Place
 * Bets tab spreads.
 */
const useRoomData = (roomId) => {
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

  const nflWeeksData = useGetNFLWeeksInRange(
    !isMLB ? room?.start_date : null,
    !isMLB ? room?.end_date : null,
  );

  const mlbWeeksData = useGetMLBWeeksInRange(
    isMLB ? room?.start_date : null,
    isMLB ? room?.end_date : null,
  );

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

  const nflCurrentWeek = isMLB ? null : resolvedCurrentWeek;
  const mlbCurrentWeek = isMLB ? resolvedCurrentWeek : null;

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
  } = useGetSlateWithOdds(
    "NFL",
    {
      week: nflSelectedWeek,
      year: nflSelectedYear,
      seasonType: nflSelectedSeasonType,
    },
    !isMLB,
  );

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
   * contains the present moment — the out-of-range case, not a "we guessed"
   * estimate.
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

  const selectedWeek = isMLB ? mlbSelectedWeekNumber : nflSelectedWeek;

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

  const nflChangeHandlers = nflCreateChangeHandlers(handleClearBets);
  const mlbChangeHandlers = mlbCreateChangeHandlers(handleClearBets);

  const refetchStandings = () => {
    refetchRoomBetsAll();
    refetchLeaderboard();
    refetchBets();
    refetchRemovedBets();
  };

  // Prebuilt prop bags for the Place Bets tab's sport-specific odds section.
  const mlbOddsProps = {
    isMLBWeeksFetching: mlbWeeksData.isMLBWeeksFetching,
    isWeekLoading: isMLBWeekLoading,
    isWeekEstimate: isMLBWeekEstimate,
    isCurrentWeekOutOfRange: isMLBWeekOutOfRange,
    isOffSeason: isMLBOffSeason,
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
    selectedWeekNumber: mlbSelectedWeekNumber,
    handleWeekChange: mlbChangeHandlers.handleWeekChange,
    weekOptions: mlbWeekOptions,
    currentWeekUserBets,
    weeklyTakenPoints,
    isMLBWeeksError: mlbWeeksData.isMLBWeeksError,
    isOddsError,
    oddsError,
    hasOdds,
    memoizedOdds,
    memoizedOddsCount,
    oddsByDay: mlbOddsByDay,
    isBetCreating,
    duplicatePointValues,
    sessionPointCounts,
    handleGameSelect,
    handleBetTypeChange,
    handleTeamChoiceChange,
    handleSelectSpread,
    handleSelectTotal,
    handlePointsChange,
    roomSport,
    sportRules,
    selectedWeek: mlbSelectedWeek,
  };

  const nflOddsProps = {
    isNFLWeeksFetching: nflWeeksData.isNFLWeeksFetching,
    isWeekLoading: isNFLWeekLoading,
    isWeekEstimate: isNFLWeekEstimate,
    isCurrentWeekOutOfRange: isNFLCurrentWeekOutOfRange,
    isOffSeason: isNFLOffSeason,
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
    selectedSeasonType: nflSelectedSeasonType,
    handleSeasonTypeChange: nflChangeHandlers.handleSeasonTypeChange,
    selectedYear: nflSelectedYear,
    handleYearChange: nflChangeHandlers.handleYearChange,
    selectedWeek: nflSelectedWeek,
    handleWeekChange: nflChangeHandlers.handleWeekChange,
    weekOptions: nflWeekOptions,
    yearOptions: nflYearOptions,
    seasonTypeOptions: nflSeasonTypeOptions,
    currentWeekUserBets,
    weeklyTakenPoints,
    isNFLWeeksError: nflWeeksData.isNFLWeeksError,
    isOddsError,
    oddsError,
    hasOdds,
    memoizedNflOdds: memoizedOdds,
    memoizedOddsCount,
    isBetCreating,
    duplicatePointValues,
    sessionPointCounts,
    handleGameSelect,
    handleBetTypeChange,
    handleTeamChoiceChange,
    handleSelectSpread,
    handleSelectTotal,
    handlePointsChange,
    existingBets,
    members,
    roomSport,
    sport,
    league,
    sportRules,
  };

  return {
    // Room record + fetch state
    room,
    roomId,
    isRoomFetching,
    isRoomError,
    roomError,
    roomRefetch,
    // Membership / identity
    currentUserId,
    members,
    isMember,
    isMembershipFetching,
    isCurrentUserAdmin,
    // Sport
    roomSport,
    isMLB,
    sportRules,
    // Standings tab data
    leaderboard,
    isLeaderboardLoading,
    roomBetsAll,
    roomBetsUsers,
    isRoomBetsAllLoading,
    removedBets,
    refetchStandings,
    // Place Bets tab prop bags
    mlbOddsProps,
    nflOddsProps,
  };
};

export default useRoomData;
