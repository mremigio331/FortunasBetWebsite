import { useState, useMemo, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { message } from "antd";
import { getSportBettingRules } from "../../configs/sportConfig";

/**
 * Custom hook encapsulating bet selection state management:
 * selectedBets, points calculation, duplicate detection,
 * weekly constraints, and bet action handlers.
 *
 * @param {object} params
 * @param {string} params.roomId
 * @param {string|null} params.currentUserId
 * @param {Array} params.existingBets - All bets for the room
 * @param {number} params.selectedWeek
 * @param {number} params.selectedSeasonType
 * @param {number} params.selectedYear
 * @param {string} params.sport - e.g. "football"
 * @param {string} params.league - e.g. "nfl"
 * @param {string} params.roomSport - e.g. "NFL" or "MLB"
 * @param {Array} params.nflOdds - Memoized sorted odds array
 * @param {Function} params.createBet - Mutation function from useCreateBet
 * @param {Function} params.refetchBets - Refetch bets after submission
 * @returns {object} Bet selection state, derived values, and handlers
 */
const useBetSelection = ({
  roomId,
  currentUserId,
  existingBets,
  selectedWeek,
  selectedSeasonType,
  selectedYear,
  sport,
  league,
  roomSport = "NFL",
  nflOdds,
  createBet,
  refetchBets,
}) => {
  const [selectedBets, setSelectedBets] = useState({});
  const queryClient = useQueryClient();

  const sportRules = useMemo(
    () => getSportBettingRules(roomSport),
    [roomSport],
  );

  const selectedBetsCount = Object.keys(selectedBets).length;

  const totalPoints = useMemo(
    () =>
      Object.values(selectedBets).reduce(
        (sum, bet) => sum + (bet?.points ?? 0),
        0,
      ),
    [selectedBets],
  );

  // Current user's bets for the selected week
  const currentWeekUserBets = useMemo(() => {
    if (!existingBets || !Array.isArray(existingBets) || !currentUserId) {
      return [];
    }
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

  // Points already used this week
  const weeklyTakenPoints = useMemo(() => {
    return currentWeekUserBets.map((bet) => bet.points_wagered);
  }, [currentWeekUserBets]);

  // Duplicate point detection (session duplicates + weekly conflicts)
  const { hasDuplicatePoints, duplicatePointValues } = useMemo(() => {
    const pointCounts = Object.values(selectedBets).reduce((acc, bet) => {
      acc[bet.points] = (acc[bet.points] || 0) + 1;
      return acc;
    }, {});

    if (sportRules.uniquePointsPerBet) {
      // NFL: each point value must be unique across session + week
      const hasDups = Object.values(pointCounts).some((count) => count > 1);
      const dupValues = Object.entries(pointCounts)
        .filter(([_, count]) => count > 1)
        .map(([points, _]) => parseInt(points));

      const weeklyConflicts = Object.values(selectedBets)
        .map((bet) => bet.points)
        .filter((points) => weeklyTakenPoints.includes(points));

      const allConflictingPoints = [
        ...new Set([...dupValues, ...weeklyTakenPoints]),
      ];

      return {
        hasDuplicatePoints: hasDups || weeklyConflicts.length > 0,
        duplicatePointValues: allConflictingPoints,
      };
    } else {
      // MLB: point values have per-value limits (e.g., max 4 at 1pt, max 1 at 6pt)
      const weeklyPointCounts = weeklyTakenPoints.reduce((acc, p) => {
        acc[p] = (acc[p] || 0) + 1;
        return acc;
      }, {});

      const overLimitPoints = [];
      let hasOverLimit = false;

      for (const [pointStr, sessionCount] of Object.entries(pointCounts)) {
        const point = parseInt(pointStr);
        const weeklyCount = weeklyPointCounts[point] || 0;
        const limit = sportRules.pointLimits[point] ?? 0;
        if (sessionCount + weeklyCount > limit) {
          hasOverLimit = true;
          overLimitPoints.push(point);
        }
      }

      // Also check total bet count
      const totalBets =
        Object.keys(selectedBets).length + weeklyTakenPoints.length;
      if (totalBets > sportRules.maxBetsPerWeek) {
        hasOverLimit = true;
      }

      return {
        hasDuplicatePoints: hasOverLimit,
        duplicatePointValues: overLimitPoints,
      };
    }
  }, [selectedBets, weeklyTakenPoints, sportRules]);

  // --- Handlers ---

  const handleClearBets = useCallback(() => {
    setSelectedBets({});
  }, []);

  const handleGameSelect = useCallback(
    (gameId, betData) => {
      setSelectedBets((prev) => {
        if (prev[gameId]) {
          const newBets = { ...prev };
          delete newBets[gameId];
          return newBets;
        }
        // Prevent selecting more games than remaining weekly slots
        const totalUsed = Object.keys(prev).length + weeklyTakenPoints.length;
        if (totalUsed >= sportRules.maxBetsPerWeek) {
          message.warning(
            `Maximum ${sportRules.maxBetsPerWeek} bets per week reached (${weeklyTakenPoints.length} existing + ${Object.keys(prev).length} selected)`,
          );
          return prev;
        }
        return {
          ...prev,
          [gameId]: { betType: "spread", teamChoice: "home", points: 1 },
        };
      });
    },
    [weeklyTakenPoints, sportRules],
  );

  const handleBetTypeChange = useCallback((gameId, betType) => {
    setSelectedBets((prev) => ({
      ...prev,
      [gameId]: {
        ...prev[gameId],
        betType,
        teamChoice: betType === "spread" ? "home" : "over",
      },
    }));
  }, []);

  const handleTeamChoiceChange = useCallback((gameId, update) => {
    setSelectedBets((prev) => ({
      ...prev,
      [gameId]: {
        ...prev[gameId],
        ...update,
      },
    }));
  }, []);

  const handlePointsChange = useCallback(
    (gameId, points) => {
      if (sportRules.allowedPoints.includes(points)) {
        setSelectedBets((prev) => ({
          ...prev,
          [gameId]: {
            ...prev[gameId],
            points,
          },
        }));
      }
    },
    [sportRules],
  );

  const handleSubmitBets = useCallback(async () => {
    const betEntries = Object.entries(selectedBets);
    if (betEntries.length === 0) {
      message.warning("Please select at least one game to bet on");
      return;
    }

    if (hasDuplicatePoints) {
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
      const betPromises = betEntries.map(async ([gameId, bet]) => {
        const game = nflOdds.find((g) => g.game_id === gameId);
        if (!game) throw new Error(`Game not found: ${gameId}`);

        let teamChoice = null;
        let overUnderChoice = null;
        if (bet.betType === "spread") {
          teamChoice = bet.teamChoice;
        } else if (bet.betType === "overUnder") {
          overUnderChoice = bet.overUnderChoice;
        }

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

        if (!game.date || game.date === null) {
          throw new Error(`Game ${gameId} is missing date - cannot place bet`);
        }

        let eventDateTime;
        try {
          const gameDate = new Date(game.date);
          if (isNaN(gameDate.getTime())) {
            throw new Error(`Game ${gameId} has invalid date: ${game.date}`);
          }
          eventDateTime = Math.floor(gameDate.getTime() / 1000);
        } catch (error) {
          if (error.message.includes("date")) throw error;
          throw new Error(
            `Failed to parse date for game ${gameId}: ${game.date}`,
          );
        }

        return createBet({
          room_id: roomId,
          game_id: gameId,
          sport: sport || "football",
          league: league || "nfl",
          season_type: parseInt(selectedSeasonType),
          week: selectedWeek,
          event_datetime: eventDateTime,
          game_bet: gameBet,
          odds_snapshot: game,
        });
      });

      await Promise.all(betPromises);
      message.success(
        `Successfully placed ${betEntries.length} bet${betEntries.length !== 1 ? "s" : ""}!`,
      );
      refetchBets();
      queryClient.invalidateQueries({ queryKey: ["homeData"] });
      setSelectedBets({});
    } catch (error) {
      console.error("Error submitting bets:", error);
    }
  }, [
    selectedBets,
    hasDuplicatePoints,
    duplicatePointValues,
    weeklyTakenPoints,
    nflOdds,
    roomId,
    createBet,
    selectedSeasonType,
    selectedWeek,
    sport,
    league,
    refetchBets,
  ]);

  // Count of each point value selected in the current session (for MLB per-value limit checks)
  const sessionPointCounts = useMemo(() => {
    return Object.values(selectedBets).reduce((acc, bet) => {
      acc[bet.points] = (acc[bet.points] || 0) + 1;
      return acc;
    }, {});
  }, [selectedBets]);

  return {
    selectedBets,
    setSelectedBets,
    selectedBetsCount,
    totalPoints,
    currentWeekUserBets,
    weeklyTakenPoints,
    hasDuplicatePoints,
    duplicatePointValues,
    sessionPointCounts,
    sportRules,
    handleClearBets,
    handleGameSelect,
    handleBetTypeChange,
    handleTeamChoiceChange,
    handlePointsChange,
    handleSubmitBets,
  };
};

export default useBetSelection;
