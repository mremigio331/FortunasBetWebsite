/**
 * `useMLBWeekSelection` — MLB week selection state for the Room_Page.
 *
 * MLB weeks are plain Mon 00:00:00 ET - Sun 23:59:59 ET ranges, so there is no
 * season-type or year selector; only a week number.
 *
 * What changed (and why):
 *
 *   1. **Adopt-on-resolve, not adopt-on-empty.** The previous version seeded
 *      `selectedWeekNumber` with `defaultWeek?.week || 1` and then gated its sync
 *      effect on `!selectedWeekNumber`. Because the seed was always truthy the
 *      condition never held again, so the containing-week default was never
 *      adopted and MLB rooms sat on Week 1 forever. Adoption is now gated only on
 *      `hasUserSelected` — it applies whether or not the state already holds a
 *      value (Requirements 1.2, 1.3, 4.2, 8.6).
 *
 *   2. **Deliberate selections win.** The week-change handler sets
 *      `hasUserSelected`, after which no resolution, refetch, or window-focus
 *      event may move the week (Requirements 2.1, 2.2).
 *
 *   3. **Eastern-Time formatting.** `selectedDate` (the YYYYMMDD odds-query date)
 *      and the dropdown range labels are derived in Eastern Time instead of with
 *      browser-local `getFullYear`/`getMonth`/`getDate`, so a viewer in Tokyo or
 *      Los Angeles sees the same dates as a viewer in New York (Requirements 3.3,
 *      3.4, 3.5).
 *
 * Which week to land on is decided by the shared `resolveWeekSelection`
 * algorithm, the same one the NFL hook uses, so both sports order their
 * resolution identically: containing week, else nearest upcoming, else most
 * recent past — always a week inside the room's range (Requirement 4.5).
 */

import { useState, useMemo, useEffect, useCallback } from "react";
import { message } from "antd";
import {
  resolveWeekSelection,
  toEpochSeconds,
  WEEK_MATCH,
} from "../../utils/weekResolution";
import {
  normalizeWeekValue,
  weekValuesMatch,
} from "../../utils/weekNormalization";
import {
  formatEasternWeekRangeLabel,
  formatEasternYyyymmddFromEpochSeconds,
} from "../../utils/easternTime";

/**
 * MLB week selection.
 *
 * The Current_Week is *not* computed here. The page resolves it once through
 * `useCurrentWeek("MLB", { room, mlbWeeksData })` — the single source of truth —
 * and threads the result in, so the room page and this hook can never disagree
 * about what "now" is.
 *
 * @param {object} params
 * @param {object|null} [params.room] Room object (`start_date`, `end_date`).
 * @param {object} params.mlbWeeksData Return value of `useGetMLBWeeksInRange`
 *   (`availableWeeks`, `getWeekByNumber`, `isMLBWeeksFetching`, ...).
 * @param {{week: number|null, seasonType: number|null, year: number|null}|null} [params.currentWeek]
 *   Resolved Current_Week from `useCurrentWeek`. When present and found in the
 *   room's range it is preferred; when absent the resolution falls back to the
 *   present instant against the range boundaries.
 * @param {boolean} [params.isCurrentWeekLoading=false] `useCurrentWeek.isLoading`.
 * @param {boolean} [params.isCurrentWeekEstimate=false] `useCurrentWeek.isEstimate`.
 * @param {boolean} [params.isOffSeason=false] `useCurrentWeek.isOffSeason`.
 * @param {number} [params.now] Present instant in epoch **milliseconds**.
 *   Defaults to `Date.now()`; injected by tests.
 * @returns {{
 *   selectedWeekNumber: number|null,
 *   setSelectedWeekNumber: Function,
 *   selectedWeek: object|null,
 *   selectedDate: string|null,
 *   weekOptions: Array<{value: number, label: string}>,
 *   hasUserSelected: boolean,
 *   resolvedWeekNumber: number|null,
 *   matchedBy: string,
 *   isWeekLoading: boolean,
 *   isWeekEstimate: boolean,
 *   isCurrentWeekOutOfRange: boolean,
 *   isOffSeason: boolean,
 *   createChangeHandlers: (clearBets: Function) => {handleWeekChange: Function},
 * }}
 */
const useMLBWeekSelection = ({
  room,
  mlbWeeksData,
  currentWeek = null,
  isCurrentWeekLoading = false,
  isCurrentWeekEstimate = false,
  isOffSeason = false,
  now,
} = {}) => {
  const {
    availableWeeks,
    getWeekByNumber,
    isMLBWeeksFetching = false,
  } = mlbWeeksData || {};

  /**
   * MLB weeks are identified by week number alone — the range entries carry no
   * season type or year — so the Current_Week is reduced to its week number
   * before it reaches the resolver. Handing the resolver a `seasonType`/`year`
   * it cannot find in the range would make every week look out-of-range.
   */
  const currentWeekNumber = normalizeWeekValue(currentWeek?.week);

  /**
   * The week the room *should* show, per the shared resolution algorithm.
   *
   * `now` stays out of the memo body as a dependency so an undefined `now`
   * (production) reads the clock once per meaningful change rather than on every
   * render.
   */
  const resolution = useMemo(
    () =>
      resolveWeekSelection({
        weeks: availableWeeks,
        now: toEpochSeconds(now === undefined ? Date.now() : now),
        currentWeek:
          currentWeekNumber === null ? null : { week: currentWeekNumber },
        preferCurrentWeek: true,
      }),
    [availableWeeks, now, currentWeekNumber],
  );

  const resolvedWeekNumber = resolution.selection
    ? normalizeWeekValue(resolution.selection.week)
    : null;

  // No provisional seed. Until the range resolves there is genuinely no week to
  // show, and `isWeekLoading` says so rather than a guess dressed as a fact
  // (Requirement 1.4).
  const [selectedWeekNumber, setSelectedWeekNumber] = useState(null);
  const [hasUserSelected, setHasUserSelected] = useState(false);

  /**
   * Adopt-on-resolve. Note what is *not* in the condition: any check that the
   * current selection is empty. That check was the bug (Requirement 1.3).
   */
  useEffect(() => {
    if (hasUserSelected) return;
    if (resolvedWeekNumber === null) return;
    if (weekValuesMatch(selectedWeekNumber, resolvedWeekNumber)) return;
    setSelectedWeekNumber(resolvedWeekNumber);
  }, [hasUserSelected, resolvedWeekNumber, selectedWeekNumber]);

  /**
   * What to render this render. Falling back to the resolved week means the
   * dropdown never flashes an unrelated week in the frame before the adoption
   * effect flushes. Once the user has chosen, their value is the only input.
   */
  const effectiveWeekNumber = hasUserSelected
    ? selectedWeekNumber
    : (selectedWeekNumber ?? resolvedWeekNumber);

  // The selected week object (start/end epochs, label). Matched numerically so a
  // string week value off the wire still finds its entry (Requirement 6.3).
  const selectedWeek = useMemo(() => {
    if (effectiveWeekNumber === null || effectiveWeekNumber === undefined) {
      return null;
    }
    if (Array.isArray(availableWeeks)) {
      const match = availableWeeks.find((week) =>
        weekValuesMatch(week?.week, effectiveWeekNumber),
      );
      if (match) return match;
    }
    return getWeekByNumber ? getWeekByNumber(effectiveWeekNumber) : null;
  }, [effectiveWeekNumber, availableWeeks, getWeekByNumber]);

  // Dropdown options, labelled with ET date ranges (Requirement 3.4).
  const weekOptions = useMemo(() => {
    if (!availableWeeks?.length) return [];
    return availableWeeks.map((week) => {
      const range = formatEasternWeekRangeLabel(week);
      return {
        value: week.week,
        label: range ? `Week ${week.week} (${range})` : `Week ${week.week}`,
      };
    });
  }, [availableWeeks]);

  // YYYYMMDD for `useGetMLBOdds`, in Eastern Time (Requirement 3.3).
  const selectedDate = useMemo(
    () =>
      selectedWeek
        ? formatEasternYyyymmddFromEpochSeconds(selectedWeek.start)
        : null,
    [selectedWeek],
  );

  const createChangeHandlers = useCallback(
    (clearBets) => ({
      handleWeekChange: (newWeekNumber) => {
        const normalized = normalizeWeekValue(newWeekNumber);
        // A Deliberate_Selection: from here on, resolutions are advisory only.
        setHasUserSelected(true);
        setSelectedWeekNumber(normalized === null ? newWeekNumber : normalized);
        if (typeof clearBets === "function") clearBets();
        message.info(`Loading games for Week ${newWeekNumber}...`);
      },
    }),
    [],
  );

  const hasRoomDates = Boolean(room?.start_date && room?.end_date);
  const isWeekLoading =
    Boolean(isCurrentWeekLoading) ||
    Boolean(isMLBWeeksFetching) ||
    (hasRoomDates && !hasUserSelected && effectiveWeekNumber === null);

  return {
    selectedWeekNumber: effectiveWeekNumber,
    // Programmatic setter: does NOT mark a Deliberate_Selection. Use
    // `createChangeHandlers().handleWeekChange` for user-driven changes.
    setSelectedWeekNumber,
    selectedWeek,
    selectedDate,
    weekOptions,
    hasUserSelected,
    resolvedWeekNumber,
    matchedBy: resolution.matchedBy || WEEK_MATCH.NONE,
    isWeekLoading,
    isWeekEstimate:
      Boolean(isCurrentWeekEstimate) ||
      Boolean(resolution.isCurrentWeekOutOfRange),
    isCurrentWeekOutOfRange: Boolean(resolution.isCurrentWeekOutOfRange),
    isOffSeason: Boolean(isOffSeason),
    createChangeHandlers,
  };
};

export default useMLBWeekSelection;
