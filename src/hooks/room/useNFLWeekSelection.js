import { useState, useMemo, useEffect } from "react";
import { message } from "antd";
import { getSeasonTypeOptions } from "../../configs/nflSeasonTypes";
import { getDefaultNFLSelection } from "../../configs/nflCurrentWeek";

/**
 * Custom hook encapsulating NFL week/year/seasonType selection state,
 * options derivation, and change handlers.
 *
 * @param {object} params
 * @param {object|null} params.room - The room object (needs start_date, end_date)
 * @param {object} params.nflWeeksData - Return value from useGetNFLWeeksInRange
 * @returns {object} Selection state, options, and handlers
 */
const useNFLWeekSelection = ({ room, nflWeeksData }) => {
  const {
    nflWeeks,
    availableSeasons,
    getSeasonTypesForYear,
    getWeeksForYearAndSeason,
    isValidCombination,
    getDefaultSelection,
  } = nflWeeksData;

  // Compute default selection from room-based NFL weeks or current date fallback
  const defaultSelection = useMemo(() => {
    if (
      room?.start_date &&
      room?.end_date &&
      nflWeeks?.length &&
      getDefaultSelection
    ) {
      const roomBasedDefault = getDefaultSelection();
      if (roomBasedDefault) return roomBasedDefault;
    }
    const currentNFLWeek = getDefaultNFLSelection();
    return {
      year: currentNFLWeek.year,
      seasonType: currentNFLWeek.seasonType,
      week: currentNFLWeek.week,
    };
  }, [room?.start_date, room?.end_date, nflWeeks, getDefaultSelection]);

  // Selection state - initialized from defaults
  const [selectedWeek, setSelectedWeek] = useState(() => defaultSelection.week);
  const [selectedYear, setSelectedYear] = useState(() => defaultSelection.year);
  const [selectedSeasonType, setSelectedSeasonType] = useState(
    () => defaultSelection.seasonType,
  );

  // Sync state if defaults load after initial render
  useEffect(() => {
    if (!selectedWeek || !selectedYear || !selectedSeasonType) {
      setSelectedWeek(defaultSelection.week);
      setSelectedYear(defaultSelection.year);
      setSelectedSeasonType(defaultSelection.seasonType);
    }
  }, [defaultSelection, selectedWeek, selectedYear, selectedSeasonType]);

  // Generate season type options for selected year
  const seasonTypeOptions = useMemo(() => {
    if (!room?.start_date || !room?.end_date || !getSeasonTypesForYear) {
      return getSeasonTypeOptions();
    }
    const seasonTypes = getSeasonTypesForYear(selectedYear);
    if (!seasonTypes || seasonTypes.length === 0) {
      return getSeasonTypeOptions();
    }
    return seasonTypes.map((st) => ({
      value: st.seasonType,
      label: st.displayName,
    }));
  }, [selectedYear, room?.start_date, room?.end_date, getSeasonTypesForYear]);

  // Ensure selected season type is valid for current options
  useEffect(() => {
    if (seasonTypeOptions.length > 0) {
      const hasValidSeasonType = seasonTypeOptions.some(
        (option) => option.value === selectedSeasonType,
      );
      if (!hasValidSeasonType) {
        setSelectedSeasonType(seasonTypeOptions[0].value);
      }
    }
  }, [seasonTypeOptions, selectedSeasonType]);

  // Generate week options based on selected year and season type
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

  // Change handlers that clear bets via the provided callback
  const createChangeHandlers = (clearBets) => ({
    handleWeekChange: (newWeek) => {
      setSelectedWeek(newWeek);
      clearBets();
      message.info(`Loading games for Week ${newWeek}...`);
    },
    handleYearChange: (newYear) => {
      setSelectedYear(newYear);
      clearBets();
      message.info(`Loading games for ${newYear}...`);
    },
    handleSeasonTypeChange: (newSeasonType) => {
      setSelectedSeasonType(newSeasonType);
      clearBets();
      const seasonName =
        seasonTypeOptions.find((opt) => opt.value === newSeasonType)?.label ||
        "season";
      message.info(`Loading ${seasonName} games...`);
    },
  });

  return {
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
  };
};

export default useNFLWeekSelection;
