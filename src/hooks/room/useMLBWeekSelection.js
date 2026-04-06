import { useState, useMemo, useEffect, useCallback } from "react";
import { message } from "antd";

/**
 * Custom hook for MLB week selection state management.
 * MLB weeks are simple Mon-Sun ranges, no season type or year selectors needed.
 *
 * @param {object} params
 * @param {object|null} params.room - Room object (needs start_date, end_date)
 * @param {object} params.mlbWeeksData - Return value from useGetMLBWeeksInRange
 * @returns {object} Selection state, week options, and handlers
 */
const useMLBWeekSelection = ({ room, mlbWeeksData }) => {
  const { availableWeeks, getDefaultSelection, getWeekByNumber } = mlbWeeksData;

  const defaultWeek = useMemo(() => {
    if (!getDefaultSelection) return null;
    return getDefaultSelection();
  }, [getDefaultSelection]);

  const [selectedWeekNumber, setSelectedWeekNumber] = useState(
    () => defaultWeek?.week || 1,
  );

  // Sync when default loads after initial render
  useEffect(() => {
    if (defaultWeek && !selectedWeekNumber) {
      setSelectedWeekNumber(defaultWeek.week);
    }
  }, [defaultWeek, selectedWeekNumber]);

  // The currently selected week object (with start/end epochs and labels)
  const selectedWeek = useMemo(() => {
    if (!getWeekByNumber) return null;
    return getWeekByNumber(selectedWeekNumber);
  }, [selectedWeekNumber, getWeekByNumber]);

  // Build week options for the dropdown
  const weekOptions = useMemo(() => {
    if (!availableWeeks?.length) return [];
    return availableWeeks.map((w) => {
      const startDate = new Date(w.start * 1000);
      const endDate = new Date(w.end * 1000);
      // Format in Eastern Time to match backend week boundaries (Mon-Sun ET)
      const fmt = (d) =>
        d.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          timeZone: "America/New_York",
        });
      return {
        value: w.week,
        label: `Week ${w.week} (${fmt(startDate)} - ${fmt(endDate)})`,
      };
    });
  }, [availableWeeks]);

  // The YYYYMMDD date string for the selected week's start (used by useGetMLBOdds)
  const selectedDate = useMemo(() => {
    if (!selectedWeek) return null;
    const d = new Date(selectedWeek.start * 1000);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}${mm}${dd}`;
  }, [selectedWeek]);

  const createChangeHandlers = useCallback(
    (clearBets) => ({
      handleWeekChange: (newWeekNumber) => {
        setSelectedWeekNumber(newWeekNumber);
        clearBets();
        message.info(`Loading games for Week ${newWeekNumber}...`);
      },
    }),
    [],
  );

  return {
    selectedWeekNumber,
    setSelectedWeekNumber,
    selectedWeek,
    selectedDate,
    weekOptions,
    createChangeHandlers,
  };
};

export default useMLBWeekSelection;
