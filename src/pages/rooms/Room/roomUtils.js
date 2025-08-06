// Utility and memoized handlers for Room.js
import { message } from "antd";

export const createHandlers = ({
  setSelectedWeek,
  setSelectedYear,
  setSelectedSeasonType,
  setSelectedBets,
  seasonTypeOptions,
}) => ({
  handleWeekChange: (newWeek) => {
    setSelectedWeek(newWeek);
    setSelectedBets({});
    message.info(`Loading games for Week ${newWeek}...`);
  },
  handleYearChange: (newYear) => {
    setSelectedYear(newYear);
    setSelectedBets({});
    message.info(`Loading games for ${newYear}...`);
  },
  handleSeasonTypeChange: (newSeasonType) => {
    setSelectedSeasonType(newSeasonType);
    setSelectedBets({});
    const seasonName =
      seasonTypeOptions.find((opt) => opt.value === newSeasonType)?.label ||
      "season";
    message.info(`Loading ${seasonName} games...`);
  },
  handleGameSelect: (selectedBets, setSelectedBets) => (gameId, betData) => {
    // Toggle selection: deselect if already selected, otherwise select
    setSelectedBets((prev) => {
      if (prev[gameId]) {
        // Deselect
        const newBets = { ...prev };
        delete newBets[gameId];
        return newBets;
      } else {
        // Select with default bet structure
        const defaultBetData = {
          betType: "spread",
          teamChoice: "home",
          points: 1,
        };
        return {
          ...prev,
          [gameId]: defaultBetData,
        };
      }
    });
  },
  handleBetTypeChange: (selectedBets, setSelectedBets) => (gameId, betType) => {
    setSelectedBets({
      ...selectedBets,
      [gameId]: {
        ...selectedBets[gameId],
        betType,
        teamChoice: betType === "spread" ? "home" : "over",
      },
    });
  },
  handleTeamChoiceChange:
    (selectedBets, setSelectedBets) => (gameId, teamChoice) => {
      setSelectedBets({
        ...selectedBets,
        [gameId]: {
          ...selectedBets[gameId],
          teamChoice,
        },
      });
    },
  handlePointsChange: (selectedBets, setSelectedBets) => (gameId, points) => {
    if (points >= 1 && points <= 3) {
      setSelectedBets({
        ...selectedBets,
        [gameId]: {
          ...selectedBets[gameId],
          points,
        },
      });
    }
  },
  handleClearBets: (setSelectedBets) => () => {
    setSelectedBets({});
  },
});
