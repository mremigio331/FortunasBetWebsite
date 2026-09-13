/**
 * `useNFLWeekSelection` — NFL week/season-type/year selection state for the
 * Room_Page.
 *
 * This is the hook the defaulting bug lived in. What changed, and why:
 *
 *   1. **Adopt-on-resolve, not adopt-on-empty.** The previous version seeded all
 *      three selection fields synchronously from `getDefaultNFLSelection()` and
 *      then gated its correction effect on
 *      `!selectedWeek || !selectedYear || !selectedSeasonType`. The seed was
 *      always truthy, so the condition never held again and the
 *      asynchronously-resolved default — the room-range default and the
 *      authoritative current week — was computed and thrown away. Adoption is now
 *      gated on one thing only: whether the user has made a Deliberate_Selection.
 *      It applies whether or not the state already holds a value
 *      (Requirements 1.2, 1.3).
 *
 *   2. **The Current_Week arrives from the single source of truth.** This hook no
 *      longer imports the Fallback_Week_Source (`configs/nflCurrentWeek.js`) and
 *      does no date math of its own. The page resolves the Current_Week once
 *      through `useCurrentWeek("NFL")` and threads it in, so the page and the
 *      hook can never disagree about what "now" is (Requirements 7.1, 7.3, 7.4).
 *
 *   3. **Deliberate selections win.** Every user-facing change handler sets
 *      `hasUserSelected`, after which no resolution, refetch, or window-focus
 *      event may move the selection. `useGetCurrentNflWeek` runs with
 *      `refetchOnWindowFocus: true`, so this is the difference between a stable
 *      page and one that yanks the user back mid-task (Requirements 2.1, 2.2, 2.3).
 *
 *   4. **Numeric matching, never cross-type `===`.** ESPN can express
 *      `week_value` / `season_type_value` as strings while the dropdowns use
 *      numbers. Every comparison against an option goes through the numeric
 *      helpers in `utils/weekNormalization`, so a resolved `"12"` still lights up
 *      option `12` instead of leaving the control blank
 *      (Requirements 6.1, 6.2, 6.3).
 *
 *   5. **No provisional week dressed as a fact.** Until something resolves, the
 *      selection is `null` and `isWeekLoading` is `true`, so the page can render a
 *      loading state instead of a guess (Requirement 1.4). `isWeekEstimate` and
 *      `isCurrentWeekOutOfRange` let it say when the week it landed on is not the
 *      true current week (Requirements 1.5, 1.6, 6.4).
 *
 * Which week to land on is decided by the shared `resolveWeekSelection`
 * algorithm — the same one `useMLBWeekSelection` uses — so both sports order
 * their resolution identically: the week containing the present moment, else the
 * nearest upcoming week, else the most recent past week, always inside the room's
 * range (Requirement 4.5).
 */

import { useState, useMemo, useEffect, useCallback } from "react";
import { message } from "antd";
import {
  getSeasonTypeOptions,
  getSeasonTypeDisplayName,
} from "../../configs/nflSeasonTypes";
import {
  resolveWeekSelection,
  toEpochSeconds,
  WEEK_MATCH,
} from "../../utils/weekResolution";
import {
  normalizeWeekValue,
  normalizeSeasonTypeValue,
  normalizeYearValue,
  weekValuesMatch,
  findMatchingOption,
  hasMatchingOption,
} from "../../utils/weekNormalization";

/** Regular season — the season type assumed when a payload omits it. */
const DEFAULT_SEASON_TYPE = 2;

/**
 * NFL week selection.
 *
 * The Current_Week is *not* computed here. `Room.js` resolves it once through
 * `useCurrentWeek(roomSport)` and passes the result in, along with that hook's
 * status flags.
 *
 * @param {object} params
 * @param {object|null} [params.room] Room object (`start_date`, `end_date`).
 *   `null` for a non-NFL room, which stands the hook down.
 * @param {object} params.nflWeeksData Return value of `useGetNFLWeeksInRange`
 *   (`nflWeeks`, `availableSeasons`, `getSeasonTypesForYear`,
 *   `getWeeksForYearAndSeason`, `isNFLWeeksFetching`, ...).
 * @param {{week: number|null, seasonType: number|null, year: number|null}|null} [params.currentWeek]
 *   Resolved Current_Week from `useCurrentWeek`. When it exists in the room's
 *   range it is preferred; otherwise resolution falls back to the present instant
 *   against the range boundaries. String values are tolerated and normalized.
 * @param {boolean} [params.isCurrentWeekLoading=false] `useCurrentWeek.isLoading`.
 * @param {boolean} [params.isCurrentWeekEstimate=false] `useCurrentWeek.isEstimate`.
 * @param {boolean} [params.isOffSeason=false] `useCurrentWeek.isOffSeason`.
 * @param {number} [params.now] Present instant in epoch **milliseconds**.
 *   Defaults to `Date.now()`; injected by tests.
 * @returns {{
 *   selectedWeek: number|null,
 *   selectedYear: number|null,
 *   selectedSeasonType: number|null,
 *   setSelectedWeek: Function,
 *   setSelectedYear: Function,
 *   setSelectedSeasonType: Function,
 *   weekOptions: Array<number>,
 *   yearOptions: Array<number>,
 *   seasonTypeOptions: Array<{value: number, label: string}>,
 *   hasUserSelected: boolean,
 *   resolvedSelection: {week: number, seasonType: number, year: number}|null,
 *   matchedBy: string,
 *   isWeekLoading: boolean,
 *   isWeekEstimate: boolean,
 *   isCurrentWeekOutOfRange: boolean,
 *   isOffSeason: boolean,
 *   isValidCombination: (year: *, seasonType: *, week: *) => boolean,
 *   createChangeHandlers: (clearBets: Function) => {
 *     handleWeekChange: Function,
 *     handleYearChange: Function,
 *     handleSeasonTypeChange: Function,
 *   },
 * }}
 */
const useNFLWeekSelection = ({
  room,
  nflWeeksData,
  currentWeek = null,
  isCurrentWeekLoading = false,
  isCurrentWeekEstimate = false,
  isOffSeason = false,
  now,
} = {}) => {
  const {
    nflWeeks,
    availableSeasons,
    getSeasonTypesForYear,
    getWeeksForYearAndSeason,
    isValidCombination: rangeIsValidCombination,
    isNFLWeeksFetching = false,
  } = nflWeeksData || {};

  const hasRoomDates = Boolean(room?.start_date && room?.end_date);

  // ---------------------------------------------------------------------------
  // Resolution: what week *should* the room show?
  // ---------------------------------------------------------------------------

  const currentWeekWeek = normalizeWeekValue(currentWeek?.week);
  const currentWeekSeasonType = normalizeSeasonTypeValue(
    currentWeek?.seasonType,
  );
  const currentWeekYear = normalizeYearValue(currentWeek?.year);

  /**
   * The Current_Week reduced to a numeric identity. Kept as a memo over the
   * three primitives so a fresh `currentWeek` object with identical values does
   * not churn everything downstream (a refetch hands back a new object).
   */
  const currentWeekIdentity = useMemo(() => {
    if (
      currentWeekWeek === null &&
      currentWeekSeasonType === null &&
      currentWeekYear === null
    ) {
      return null;
    }
    return {
      week: currentWeekWeek,
      seasonType: currentWeekSeasonType,
      year: currentWeekYear,
    };
  }, [currentWeekWeek, currentWeekSeasonType, currentWeekYear]);

  const resolution = useMemo(
    () =>
      resolveWeekSelection({
        weeks: nflWeeks,
        now: toEpochSeconds(now === undefined ? Date.now() : now),
        currentWeek: currentWeekIdentity,
        preferCurrentWeek: true,
      }),
    [nflWeeks, now, currentWeekIdentity],
  );

  /**
   * The resolved default, as three plain numbers.
   *
   * Normally this comes from the Room_Week_Range. When the range is unavailable
   * (still loading, empty, or the room has no dates) the reported Current_Week is
   * used directly, so the page still lands on the right week instead of nothing
   * (Requirement 1.1).
   */
  const resolvedSelection = useMemo(() => {
    const fromRange = resolution.selection;
    if (fromRange && fromRange.week !== null && fromRange.year !== null) {
      return {
        week: fromRange.week,
        seasonType: fromRange.seasonType ?? DEFAULT_SEASON_TYPE,
        year: fromRange.year,
      };
    }
    if (
      currentWeekIdentity &&
      currentWeekIdentity.week !== null &&
      currentWeekIdentity.year !== null
    ) {
      return {
        week: currentWeekIdentity.week,
        seasonType: currentWeekIdentity.seasonType ?? DEFAULT_SEASON_TYPE,
        year: currentWeekIdentity.year,
      };
    }
    return null;
  }, [resolution, currentWeekIdentity]);

  // Primitives, so the adoption effect's dependencies are stable across renders
  // even though `nflWeeks` is a fresh array on every render of the page.
  const resolvedWeekValue = resolvedSelection ? resolvedSelection.week : null;
  const resolvedSeasonTypeValue = resolvedSelection
    ? resolvedSelection.seasonType
    : null;
  const resolvedYearValue = resolvedSelection ? resolvedSelection.year : null;

  // ---------------------------------------------------------------------------
  // State
  // ---------------------------------------------------------------------------

  // No provisional seed: until something resolves there is genuinely no week to
  // show, and `isWeekLoading` says so (Requirement 1.4).
  const [selectedWeek, setSelectedWeek] = useState(null);
  const [selectedYear, setSelectedYear] = useState(null);
  const [selectedSeasonType, setSelectedSeasonType] = useState(null);
  const [hasUserSelected, setHasUserSelected] = useState(false);

  /**
   * Adopt-on-resolve.
   *
   * Note what is *absent* from the condition: any check that the current
   * selection is empty. That check was the bug (Requirement 1.3). The only gate
   * is `hasUserSelected` (Requirements 2.1, 2.2).
   */
  useEffect(() => {
    if (hasUserSelected) return;
    if (resolvedWeekValue === null) return;

    const alreadyApplied =
      weekValuesMatch(selectedWeek, resolvedWeekValue) &&
      weekValuesMatch(selectedSeasonType, resolvedSeasonTypeValue) &&
      weekValuesMatch(selectedYear, resolvedYearValue);
    if (alreadyApplied) return;

    setSelectedWeek(resolvedWeekValue);
    setSelectedSeasonType(resolvedSeasonTypeValue);
    setSelectedYear(resolvedYearValue);
  }, [
    hasUserSelected,
    resolvedWeekValue,
    resolvedSeasonTypeValue,
    resolvedYearValue,
    selectedWeek,
    selectedSeasonType,
    selectedYear,
  ]);

  /**
   * What to render *this* render. Falling back to the resolved value means the
   * dropdowns never flash an unrelated week in the frame before the adoption
   * effect flushes. Once the user has chosen, their value is the only input.
   */
  const effectiveWeek = hasUserSelected
    ? selectedWeek
    : (selectedWeek ?? resolvedWeekValue);
  const effectiveSeasonType = hasUserSelected
    ? selectedSeasonType
    : (selectedSeasonType ?? resolvedSeasonTypeValue);
  const effectiveYear = hasUserSelected
    ? selectedYear
    : (selectedYear ?? resolvedYearValue);

  // ---------------------------------------------------------------------------
  // Options
  // ---------------------------------------------------------------------------

  const seasonTypeOptions = useMemo(() => {
    const year = normalizeYearValue(effectiveYear);
    if (!hasRoomDates || !getSeasonTypesForYear || year === null) {
      return getSeasonTypeOptions();
    }
    const seasonTypes = getSeasonTypesForYear(year);
    if (!seasonTypes || seasonTypes.length === 0) {
      return getSeasonTypeOptions();
    }
    return seasonTypes.map((entry) => ({
      value: entry.seasonType,
      label: entry.displayName || getSeasonTypeDisplayName(entry.seasonType),
    }));
  }, [effectiveYear, hasRoomDates, getSeasonTypesForYear]);

  const weekOptions = useMemo(() => {
    if (!hasRoomDates || !getWeeksForYearAndSeason) return [];
    const year = normalizeYearValue(effectiveYear);
    const seasonType = normalizeSeasonTypeValue(effectiveSeasonType);
    if (year === null || seasonType === null) return [];
    return getWeeksForYearAndSeason(year, seasonType) || [];
  }, [
    effectiveYear,
    effectiveSeasonType,
    hasRoomDates,
    getWeeksForYearAndSeason,
  ]);

  const yearOptions = useMemo(() => {
    if (!availableSeasons?.length) return [new Date().getFullYear()];
    // A year appears once per season type in `availableSeasons`; the dropdown
    // wants it once.
    const years = availableSeasons
      .map((season) => normalizeYearValue(season.year))
      .filter((year) => year !== null);
    return [...new Set(years)].sort((a, b) => a - b);
  }, [availableSeasons]);

  /**
   * Keep the three controls coherent *after* a Deliberate_Selection.
   *
   * Picking a different year can invalidate the season type, and either can
   * invalidate the week; without a correction the control would render blank.
   * These only run once the user is driving — while adoption is in charge the
   * resolver already guarantees an in-range combination, and correcting there
   * would fight the adoption effect.
   */
  useEffect(() => {
    if (!hasUserSelected) return;
    if (!seasonTypeOptions.length) return;
    if (hasMatchingOption(seasonTypeOptions, selectedSeasonType)) return;
    const fallback = seasonTypeOptions[0];
    setSelectedSeasonType(
      normalizeSeasonTypeValue(fallback.value) ?? fallback.value,
    );
  }, [hasUserSelected, seasonTypeOptions, selectedSeasonType]);

  useEffect(() => {
    if (!hasUserSelected) return;
    if (!weekOptions.length) return;
    if (hasMatchingOption(weekOptions, selectedWeek)) return;
    setSelectedWeek(normalizeWeekValue(weekOptions[0]) ?? weekOptions[0]);
  }, [hasUserSelected, weekOptions, selectedWeek]);

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------

  /**
   * Numeric-safe validity check: matches by value, never by cross-type `===`
   * (Requirement 6.3).
   */
  const isValidCombination = useCallback(
    (year, seasonType, week) => {
      const numericYear = normalizeYearValue(year);
      const numericSeasonType = normalizeSeasonTypeValue(seasonType);
      const numericWeek = normalizeWeekValue(week);
      if (
        numericYear === null ||
        numericSeasonType === null ||
        numericWeek === null
      ) {
        return false;
      }
      if (typeof getWeeksForYearAndSeason === "function") {
        const weeks =
          getWeeksForYearAndSeason(numericYear, numericSeasonType) || [];
        return hasMatchingOption(weeks, numericWeek);
      }
      return typeof rangeIsValidCombination === "function"
        ? Boolean(
            rangeIsValidCombination(
              numericYear,
              numericSeasonType,
              numericWeek,
            ),
          )
        : false;
    },
    [getWeeksForYearAndSeason, rangeIsValidCombination],
  );

  /**
   * User-facing change handlers. Each one records a Deliberate_Selection and
   * clears the pending bets that belonged to the previous week (Requirement 2.4).
   */
  const createChangeHandlers = useCallback(
    (clearBets) => {
      const clear = () => {
        if (typeof clearBets === "function") clearBets();
      };

      return {
        handleWeekChange: (newWeek) => {
          const normalized = normalizeWeekValue(newWeek);
          setHasUserSelected(true);
          setSelectedWeek(normalized === null ? newWeek : normalized);
          clear();
          message.info(`Loading games for Week ${newWeek}...`);
        },
        handleYearChange: (newYear) => {
          const normalized = normalizeYearValue(newYear);
          setHasUserSelected(true);
          setSelectedYear(normalized === null ? newYear : normalized);
          clear();
          message.info(`Loading games for ${newYear}...`);
        },
        handleSeasonTypeChange: (newSeasonType) => {
          const normalized = normalizeSeasonTypeValue(newSeasonType);
          setHasUserSelected(true);
          setSelectedSeasonType(
            normalized === null ? newSeasonType : normalized,
          );
          clear();
          const option = findMatchingOption(seasonTypeOptions, newSeasonType);
          message.info(`Loading ${option?.label || "season"} games...`);
        },
      };
    },
    [seasonTypeOptions],
  );

  // ---------------------------------------------------------------------------
  // Status flags for the page
  // ---------------------------------------------------------------------------

  const isWeekLoading =
    Boolean(isCurrentWeekLoading) ||
    Boolean(isNFLWeeksFetching) ||
    (hasRoomDates && !hasUserSelected && effectiveWeek === null);

  const isCurrentWeekOutOfRange = Boolean(resolution.isCurrentWeekOutOfRange);

  return {
    selectedWeek: effectiveWeek ?? null,
    selectedYear: effectiveYear ?? null,
    selectedSeasonType: effectiveSeasonType ?? null,

    // Programmatic setters: they do NOT record a Deliberate_Selection. Use
    // `createChangeHandlers()` for anything the user drives.
    setSelectedWeek,
    setSelectedYear,
    setSelectedSeasonType,

    weekOptions,
    yearOptions,
    seasonTypeOptions,

    hasUserSelected,
    resolvedSelection,
    matchedBy: resolution.matchedBy || WEEK_MATCH.NONE,

    isWeekLoading,
    isWeekEstimate: Boolean(isCurrentWeekEstimate) || isCurrentWeekOutOfRange,
    isCurrentWeekOutOfRange,
    isOffSeason: Boolean(isOffSeason),

    isValidCombination,
    createChangeHandlers,
  };
};

export default useNFLWeekSelection;
