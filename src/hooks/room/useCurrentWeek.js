/**
 * `useCurrentWeek` — the single client-side source of truth for the Current_Week
 * (Requirements 7.1, 7.3, 7.4).
 *
 * Every caller that needs "which week is it right now" goes through this hook.
 * Nothing else may recompute the current week, and nothing else may import the
 * Fallback_Week_Source (`src/configs/nflCurrentWeek.js`) directly.
 *
 * Where the answer comes from, by sport:
 *
 *   NFL — the Authoritative_Week_Source: `/bet/get_current_nfl_week` via
 *   `useGetCurrentNflWeek`, which resolves the week from the ESPN schedule
 *   calendar server-side. Its `week_value` / `season_type_value` are normalized
 *   to numbers before they leave this hook (Requirement 6.1). If the request
 *   fails, or the backend reports off-season, the ET-correct client estimate
 *   from `getDefaultNFLSelection()` is used instead and `isEstimate` is set
 *   (Requirements 1.5, 7.2).
 *
 *   MLB — derived from the room's week range (`/odds/get_mlb_weeks_in_range`),
 *   whose Mon 00:00:00 - Sun 23:59:59 boundaries are already Eastern-Time
 *   correct, plus the present instant. No extra backend call is needed: the
 *   shared `resolveWeekSelection` algorithm picks the week containing "now".
 *
 * Timezone contract (Requirement 3.1): the present moment is compared as an
 * absolute epoch instant against ET-derived boundaries, and the MLB season year
 * is read through `getEasternDateParts`. No browser-local date accessors are
 * used, so two viewers in different zones resolve the same week.
 *
 * While the authoritative source is still in flight, `currentWeek` is `null` and
 * `isLoading` is `true` — a provisional week is deliberately NOT returned, so
 * the page can show a loading state instead of presenting a guess as confirmed
 * (Requirement 1.4).
 *
 * Mapping the resolved week into a room's week range, and preserving deliberate
 * user selections, are the selection hooks' jobs — not this hook's.
 */

import { useMemo } from "react";
import useGetCurrentNflWeek from "../bet/useGetCurrentNflWeek";
import useGetMLBWeeksInRange from "../odds/useGetMLBWeeksInRange";
import { getDefaultNFLSelection } from "../../configs/nflCurrentWeek";
import {
  normalizeCurrentWeekPayload,
  toNumericValue,
} from "../../utils/weekNormalization";
import {
  resolveWeekSelection,
  toEpochSeconds,
  WEEK_MATCH,
} from "../../utils/weekResolution";
import { fromEpochSeconds, getEasternDateParts } from "../../utils/easternTime";

/** MLB has no season-type selector; the contract fixes it to regular season. */
export const MLB_SEASON_TYPE = 2;

const EMPTY_RESULT = {
  currentWeek: null,
  isLoading: false,
  isEstimate: false,
  isOffSeason: false,
  matchedBy: WEEK_MATCH.NONE,
  isError: false,
};

/** Is this the MLB flavour of the hook? Anything else is treated as NFL. */
const isMlbSport = (sport) =>
  typeof sport === "string" && sport.trim().toUpperCase() === "MLB";

/**
 * Pull a week list out of whatever the caller handed in: the object returned by
 * `useGetMLBWeeksInRange`, or a plain array of week entries. `null` means "the
 * caller gave us nothing", which is what makes this hook fetch the range itself.
 */
const toWeeksArray = (mlbWeeksData) => {
  if (Array.isArray(mlbWeeksData)) return mlbWeeksData;
  if (mlbWeeksData && typeof mlbWeeksData === "object") {
    if (Array.isArray(mlbWeeksData.availableWeeks)) {
      return mlbWeeksData.availableWeeks;
    }
    if (Array.isArray(mlbWeeksData.mlbWeeks)) return mlbWeeksData.mlbWeeks;
  }
  return null;
};

/**
 * Has the Authoritative_Week_Source actually answered? An off-season answer
 * counts: `is_off_season: true` with null week fields is a real answer, not an
 * empty payload (Requirement 5.5).
 */
const hasAuthoritativeAnswer = (payload) => {
  if (!payload || typeof payload !== "object") return false;
  if (typeof payload.is_off_season === "boolean") return true;
  return toNumericValue(payload.week_value) !== null;
};

/** A usable authoritative week: answered, in-season, and carries a week number. */
const isUsableAuthoritativeWeek = (payload) =>
  hasAuthoritativeAnswer(payload) &&
  payload.is_off_season !== true &&
  toNumericValue(payload.week_value) !== null;

/** The ET calendar year an MLB week belongs to, from its start boundary. */
const easternYearOfEpochSeconds = (epochSeconds) => {
  const parts = getEasternDateParts(fromEpochSeconds(epochSeconds));
  return parts ? parts.year : null;
};

/**
 * @typedef {Object} ResolvedCurrentWeek
 * @property {number|null} week
 * @property {number|null} seasonType NFL season type; MLB is always 2.
 * @property {number|null} year NFL Season_Year, or the MLB week's ET year.
 */

/**
 * @typedef {Object} CurrentWeekResult
 * @property {ResolvedCurrentWeek|null} currentWeek Normalized, numeric. `null`
 *   while the source is loading or when no week could be determined at all.
 * @property {boolean} isLoading The Current_Week source is still resolving.
 * @property {boolean} isEstimate The value is not the authoritative current
 *   week — the Fallback_Week_Source was used (NFL), or the room's range does not
 *   cover the present moment (MLB).
 * @property {boolean} isOffSeason The present moment is in the off-season.
 * @property {string} matchedBy Supplementary: how the week was arrived at, one
 *   of {@link WEEK_MATCH}.
 * @property {boolean} isError Supplementary: the underlying request failed.
 */

/**
 * The Current_Week for a sport.
 *
 * @param {"NFL"|"MLB"|string|null|undefined} sport Room sport; anything other
 *   than `"MLB"` is treated as NFL (matching `room?.sport || "NFL"`).
 * @param {Object} [options]
 * @param {Object|null} [options.room] Room, used for `start_date`/`end_date`
 *   when this hook has to fetch the MLB range itself.
 * @param {number|string|Date|null} [options.startDate] Overrides `room.start_date`.
 * @param {number|string|Date|null} [options.endDate] Overrides `room.end_date`.
 * @param {Object|Array|null} [options.mlbWeeksData] An already-fetched MLB range
 *   (the `useGetMLBWeeksInRange` return value, or its `availableWeeks` array).
 *   Supply this when the caller already holds the range so no second request is
 *   made.
 * @param {number} [options.now] Present instant in epoch **milliseconds**.
 *   Defaults to `Date.now()`; injected by tests.
 * @param {boolean} [options.enabled=true] Set `false` to stand the hook down
 *   (e.g. before the room has loaded).
 * @returns {CurrentWeekResult}
 */
const useCurrentWeek = (sport, options = {}) => {
  const {
    room = null,
    startDate,
    endDate,
    mlbWeeksData = null,
    now,
    enabled = true,
  } = options;

  const isMLB = isMlbSport(sport);
  const isNFL = !isMLB;

  // --- Authoritative_Week_Source (NFL) ---
  const {
    currentWeekInfo,
    isFetching: isNflFetching,
    isError: isNflError,
    status: nflStatus,
  } = useGetCurrentNflWeek(isNFL && enabled);

  // --- Room week range (MLB) ---
  const providedWeeks = toWeeksArray(mlbWeeksData);
  const shouldFetchRange = isMLB && enabled && providedWeeks === null;
  const resolvedStartDate =
    startDate !== undefined ? startDate : room?.start_date;
  const resolvedEndDate = endDate !== undefined ? endDate : room?.end_date;

  const internalRange = useGetMLBWeeksInRange(
    shouldFetchRange ? (resolvedStartDate ?? null) : null,
    shouldFetchRange ? (resolvedEndDate ?? null) : null,
  );

  const mlbWeeks =
    providedWeeks !== null ? providedWeeks : internalRange.availableWeeks;
  const isRangeFetching =
    providedWeeks !== null
      ? Boolean(mlbWeeksData && mlbWeeksData.isMLBWeeksFetching)
      : Boolean(internalRange.isMLBWeeksFetching);
  const isRangeError =
    providedWeeks !== null
      ? Boolean(mlbWeeksData && mlbWeeksData.isMLBWeeksError)
      : Boolean(internalRange.isMLBWeeksError);

  return useMemo(() => {
    if (!enabled) return EMPTY_RESULT;

    if (isMLB) {
      // MLB boundaries are already ET-correct, so the containing week is found
      // by comparing absolute instants — no client date math, no extra request.
      const hasWeeks = Array.isArray(mlbWeeks) && mlbWeeks.length > 0;
      if (!hasWeeks) {
        return {
          ...EMPTY_RESULT,
          isLoading: isRangeFetching,
          isError: isRangeError,
        };
      }

      const resolution = resolveWeekSelection({
        weeks: mlbWeeks,
        now: toEpochSeconds(now === undefined ? Date.now() : now),
        preferCurrentWeek: false,
      });

      if (!resolution.selectedWeek) {
        return { ...EMPTY_RESULT, isError: isRangeError };
      }

      const isContainingWeek = resolution.matchedBy === WEEK_MATCH.CONTAINING;

      return {
        currentWeek: {
          week: resolution.selection.week,
          seasonType: resolution.selection.seasonType ?? MLB_SEASON_TYPE,
          year:
            resolution.selection.year ??
            easternYearOfEpochSeconds(resolution.selectedWeek.start),
        },
        isLoading: false,
        // The room's range does not cover "now", so the nearest week is the
        // best available answer rather than the true current week.
        isEstimate: !isContainingWeek,
        isOffSeason: false,
        matchedBy: resolution.matchedBy,
        isError: isRangeError,
      };
    }

    // --- NFL ---
    const payload = currentWeekInfo || null;
    const hasAnswer = hasAuthoritativeAnswer(payload);

    // No answer yet and a request is in flight: report loading rather than
    // handing back a provisional week (Requirement 1.4). A disabled query sits
    // at status "loading" with nothing fetching, which is not loading.
    if (!hasAnswer && !isNflError && nflStatus === "loading" && isNflFetching) {
      return { ...EMPTY_RESULT, isLoading: true };
    }

    if (isUsableAuthoritativeWeek(payload)) {
      return {
        currentWeek: normalizeCurrentWeekPayload(payload),
        isLoading: false,
        isEstimate: false,
        isOffSeason: false,
        matchedBy: WEEK_MATCH.AUTHORITATIVE,
        isError: false,
      };
    }

    // Request failed, or the backend reported off-season, or the payload has no
    // usable week: fall back to the client estimate and say so (Requirement 1.5).
    const fallback = getDefaultNFLSelection(
      now === undefined ? new Date() : new Date(now),
    );

    return {
      currentWeek: normalizeCurrentWeekPayload(fallback),
      isLoading: false,
      isEstimate: true,
      isOffSeason: payload?.is_off_season === true || fallback.isOffSeason,
      matchedBy: WEEK_MATCH.NONE,
      isError: Boolean(isNflError),
    };
  }, [
    enabled,
    isMLB,
    mlbWeeks,
    isRangeFetching,
    isRangeError,
    now,
    currentWeekInfo,
    isNflError,
    isNflFetching,
    nflStatus,
  ]);
};

export default useCurrentWeek;
