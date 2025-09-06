// roomHandlers.js
// Contains handler functions for Room.js

import { message } from "antd";

export function createRoomHandlers({
  setSelectedWeek,
  setSelectedYear,
  setSelectedSeasonType,
  setSelectedBets,
  seasonTypeOptions,
  selectedBets,
  setSelectedBetsRef,
}) {
  // Week change handler
  const handleWeekChange = (newWeek) => {
    setSelectedWeek(newWeek);
    setSelectedBets({});
    message.info(`Loading games for Week ${newWeek}...`);
  };

  // Year change handler
  const handleYearChange = (newYear) => {
    setSelectedYear(newYear);
    setSelectedBets({});
    message.info(`Loading games for ${newYear}...`);
  };

  // Season type change handler
  const handleSeasonTypeChange = (newSeasonType) => {
    setSelectedSeasonType(newSeasonType);
    setSelectedBets({});
    const seasonName =
      seasonTypeOptions.find((opt) => opt.value === newSeasonType)?.label ||
      "season";
    message.info(`Loading ${seasonName} games...`);
  };

  // Game select handler
  const handleGameSelect = (selectedBets, setSelectedBets) => (gameId) => {
    if (selectedBets[gameId]) {
      const newBets = { ...selectedBets };
      delete newBets[gameId];
      setSelectedBets(newBets);
    } else {
      if (Object.keys(selectedBets).length >= 3) {
        message.warning("You can only select up to 3 games for betting");
        return;
      }
      const updatedBets = {
        ...selectedBets,
        [gameId]: {
          betType: "spread",
          teamChoice: "home",
          points: 1,
        },
      };
      setSelectedBets(updatedBets);
    }
  };

  // Bet type change handler
  const handleBetTypeChange =
    (selectedBets, setSelectedBets) => (gameId, betType) => {
      setSelectedBets({
        ...selectedBets,
        [gameId]: {
          ...selectedBets[gameId],
          betType,
          teamChoice: betType === "spread" ? "home" : "over",
        },
      });
    };

  // Team choice change handler
  const handleTeamChoiceChange =
    (selectedBets, setSelectedBets) => (gameId, teamChoice) => {
      setSelectedBets({
        ...selectedBets,
        [gameId]: {
          ...selectedBets[gameId],
          teamChoice,
        },
      });
    };

  // Points change handler
  const handlePointsChange =
    (selectedBets, setSelectedBets) => (gameId, points) => {
      if (points >= 1 && points <= 3) {
        setSelectedBets({
          ...selectedBets,
          [gameId]: {
            ...selectedBets[gameId],
            points,
          },
        });
      }
    };

  // Clear bets handler
  const handleClearBets = () => {
    setSelectedBets({});
  };

  return {
    handleWeekChange,
    handleYearChange,
    handleSeasonTypeChange,
    handleGameSelect,
    handleBetTypeChange,
    handleTeamChoiceChange,
    handlePointsChange,
    handleClearBets,
  };
}
