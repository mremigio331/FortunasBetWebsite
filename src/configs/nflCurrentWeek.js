/**
 * NFL **Fallback_Week_Source** — a client-side estimate of the current NFL week.
 *
 * This module is a fallback, not a source of truth. The authoritative current
 * week comes from `/bet/get_current_nfl_week` (the ESPN schedule calendar).
 * Nothing should import this file directly: it is reached only through the
 * single-source hook (`src/hooks/room/useCurrentWeek.js`), which surfaces the
 * result as an estimate when the authoritative source is unavailable
 * (Requirements 7.1, 7.2, 7.3, 7.4).
 *
 * Timezone contract (Requirements 3.1, 3.5):
 *   - the present moment is reduced to its **Eastern-Time** calendar date via
 *     `getEasternDateParts` (`Intl.DateTimeFormat` with an explicit
 *     `timeZone: "America/New_York"`)
 *   - all boundary math then runs on integer ET day indices, so it never
 *     touches `getFullYear`/`getMonth`/`getDate` or the local `new Date(y,m,d)`
 *     constructor, and cannot drift by viewer time zone
 *
 * Boundary derivation (Requirement 7.5): week boundaries are derived from the
 * **actual season start date** — NFL Week 1 kicks off on the Thursday after
 * Labor Day (the first Monday in September) — rather than from a fixed calendar
 * day such as "September 1". Every other boundary is measured off that kickoff,
 * so the estimate tracks the real schedule from year to year instead of drifting.
 *
 * It remains an estimate: it assumes fixed-length season segments and does not
 * know about flexed games, international kickoffs, or calendar oddities. When
 * precision matters, use the authoritative source.
 */

import { getSeasonTypeMaxWeeks } from "./nflSeasonTypes";
import { getEasternDateParts } from "../utils/easternTime";

const MS_PER_DAY = 86400000;
const DAYS_PER_WEEK = 7;

/** ESPN season type codes. */
const SEASON_TYPE = {
  PRESEASON: 1,
  REGULAR_SEASON: 2,
  POSTSEASON: 3,
};

const PRESEASON_WEEKS = getSeasonTypeMaxWeeks(SEASON_TYPE.PRESEASON);
const REGULAR_SEASON_WEEKS = getSeasonTypeMaxWeeks(SEASON_TYPE.REGULAR_SEASON);
const POSTSEASON_WEEKS = getSeasonTypeMaxWeeks(SEASON_TYPE.POSTSEASON);

/**
 * The playoffs occupy one more calendar week than they have rounds: there is a
 * bye between the conference championships and the Super Bowl.
 */
const POSTSEASON_CALENDAR_WEEKS = POSTSEASON_WEEKS + 1;

/** Labor Day, and therefore the season start, always falls in September. */
const SEASON_START_MONTH = 9;
/** Day-of-week code for Monday, as produced by {@link dayOfWeek}. */
const MONDAY = 1;
/** Week 1 kicks off on the Thursday after Labor Day. */
const LABOR_DAY_TO_KICKOFF_DAYS = 3;

/** The last calendar month that still belongs to the *previous* season year. */
const LAST_PRIOR_SEASON_MONTH = 7;

/**
 * Integer day index (days since 1970-01-01) for a calendar date.
 *
 * `Date.UTC` is used purely as calendar arithmetic on the ET date fields — it
 * introduces no local-time dependency, unlike `new Date(y, m, d)`.
 *
 * @param {number} year
 * @param {number} month 1-indexed
 * @param {number} day
 * @returns {number}
 */
const toDayIndex = (year, month, day) =>
  Math.floor(Date.UTC(year, month - 1, day) / MS_PER_DAY);

/**
 * Inverse of {@link toDayIndex}: a day index back to calendar fields.
 *
 * @param {number} dayIndex
 * @returns {{year: number, month: number, day: number}}
 */
const fromDayIndex = (dayIndex) => {
  const date = new Date(dayIndex * MS_PER_DAY);
  return {
    year: date.getUTCFullYear(),
    month: date.getUTCMonth() + 1,
    day: date.getUTCDate(),
  };
};

/**
 * Day of week for a day index: 0 = Sunday ... 6 = Saturday.
 * Epoch day 0 (1970-01-01) was a Thursday, hence the `+ 4`.
 *
 * @param {number} dayIndex
 * @returns {number}
 */
const dayOfWeek = (dayIndex) => (((dayIndex + 4) % 7) + 7) % 7;

/**
 * Labor Day — the first Monday in September — as a day index.
 *
 * @param {number} seasonYear
 * @returns {number}
 */
const laborDayIndex = (seasonYear) => {
  const september1 = toDayIndex(seasonYear, SEASON_START_MONTH, 1);
  const daysUntilMonday =
    (MONDAY - dayOfWeek(september1) + DAYS_PER_WEEK) % DAYS_PER_WEEK;
  return september1 + daysUntilMonday;
};

/**
 * The ET calendar fields of an instant, defaulting to "now" when the input is
 * not a valid instant so callers always get a usable estimate back.
 *
 * @param {Date|number|string} dateLike
 * @returns {{year: number, month: number, day: number}}
 */
const easternPartsOrNow = (dateLike) =>
  getEasternDateParts(dateLike) || getEasternDateParts(new Date());

/** Clamp an estimated week into `[1, maxWeeks]`. */
const clampWeek = (week, maxWeeks) => Math.min(Math.max(week, 1), maxWeeks);

/** 1-indexed week number of `dayIndex` within a segment starting at `start`. */
const weekWithinSegment = (dayIndex, start, maxWeeks) =>
  clampWeek(Math.floor((dayIndex - start) / DAYS_PER_WEEK) + 1, maxWeeks);

/**
 * Season segment boundaries, all derived from the actual Week 1 kickoff
 * (Requirement 7.5). Boundaries are inclusive ET day indices.
 *
 * @param {number} seasonYear
 * @returns {{
 *   preseasonStart: number, preseasonEnd: number,
 *   regularSeasonStart: number, regularSeasonEnd: number,
 *   postseasonStart: number, postseasonEnd: number,
 * }}
 */
const getSeasonBoundaries = (seasonYear) => {
  const regularSeasonStart =
    laborDayIndex(seasonYear) + LABOR_DAY_TO_KICKOFF_DAYS;
  const regularSeasonEnd =
    regularSeasonStart + REGULAR_SEASON_WEEKS * DAYS_PER_WEEK - 1;
  const postseasonStart = regularSeasonEnd + 1;

  return {
    preseasonStart: regularSeasonStart - PRESEASON_WEEKS * DAYS_PER_WEEK,
    preseasonEnd: regularSeasonStart - 1,
    regularSeasonStart,
    regularSeasonEnd,
    postseasonStart,
    postseasonEnd:
      postseasonStart + POSTSEASON_CALENDAR_WEEKS * DAYS_PER_WEEK - 1,
  };
};

/**
 * The Season_Year an instant belongs to, evaluated in Eastern Time.
 *
 * August–December belong to that calendar year's season; January–July still
 * belong to the previous one (matching the backend's `get_nfl_season_year`).
 *
 * @param {Date|number|string} [dateLike] defaults to now
 * @returns {number}
 */
export const getNFLSeasonYear = (dateLike = new Date()) => {
  const { year, month } = easternPartsOrNow(dateLike);
  return month <= LAST_PRIOR_SEASON_MONTH ? year - 1 : year;
};

/**
 * The actual Week 1 kickoff date for a season: the Thursday after Labor Day.
 *
 * Exported so the derivation can be asserted directly and so callers never have
 * to re-guess a fixed calendar day.
 *
 * @param {number} seasonYear
 * @returns {{year: number, month: number, day: number}} ET calendar date
 */
export const getNFLRegularSeasonStart = (seasonYear) =>
  fromDayIndex(laborDayIndex(seasonYear) + LABOR_DAY_TO_KICKOFF_DAYS);

/**
 * Estimate the NFL season type and week containing an instant.
 *
 * @param {Date|number|string} [dateLike] defaults to now
 * @returns {{
 *   seasonType: number,
 *   week: number,
 *   year: number,
 *   seasonName: string,
 *   displayName: string,
 *   isOffSeason?: boolean,
 * }}
 */
export const getCurrentNFLWeek = (dateLike = new Date()) => {
  const parts = easternPartsOrNow(dateLike);
  const today = toDayIndex(parts.year, parts.month, parts.day);
  const seasonYear = getNFLSeasonYear(dateLike);
  const bounds = getSeasonBoundaries(seasonYear);

  if (today >= bounds.preseasonStart && today <= bounds.preseasonEnd) {
    return {
      seasonType: SEASON_TYPE.PRESEASON,
      week: weekWithinSegment(today, bounds.preseasonStart, PRESEASON_WEEKS),
      year: seasonYear,
      seasonName: "preseason",
      displayName: `${seasonYear} Preseason`,
    };
  }

  if (today >= bounds.regularSeasonStart && today <= bounds.regularSeasonEnd) {
    return {
      seasonType: SEASON_TYPE.REGULAR_SEASON,
      week: weekWithinSegment(
        today,
        bounds.regularSeasonStart,
        REGULAR_SEASON_WEEKS,
      ),
      year: seasonYear,
      seasonName: "regular_season",
      displayName: `${seasonYear} Regular Season`,
    };
  }

  if (today >= bounds.postseasonStart && today <= bounds.postseasonEnd) {
    return {
      seasonType: SEASON_TYPE.POSTSEASON,
      week: weekWithinSegment(today, bounds.postseasonStart, POSTSEASON_WEEKS),
      year: seasonYear,
      seasonName: "postseason",
      displayName: `${seasonYear} Playoffs`,
    };
  }

  // Off-season. Before this season's preseason opens we are waiting on
  // `seasonYear`; once the Super Bowl has passed, on the season after it.
  const upcomingSeasonYear =
    today < bounds.preseasonStart ? seasonYear : seasonYear + 1;

  return {
    seasonType: SEASON_TYPE.REGULAR_SEASON,
    week: 1,
    year: upcomingSeasonYear,
    seasonName: "regular_season",
    displayName: `${upcomingSeasonYear} Regular Season`,
    isOffSeason: true,
  };
};

/**
 * The fallback Current_Week in the shape the selection state consumes.
 *
 * Consumed by `useCurrentWeek` only, which flags the result as an estimate
 * (Requirement 1.5).
 *
 * @param {Date|number|string} [dateLike] defaults to now
 * @returns {{
 *   year: number,
 *   seasonType: number,
 *   week: number,
 *   isCurrentWeek: boolean,
 *   isOffSeason: boolean,
 *   displayText: string,
 * }}
 */
export const getDefaultNFLSelection = (dateLike = new Date()) => {
  const current = getCurrentNFLWeek(dateLike);
  const isOffSeason = Boolean(current.isOffSeason);

  return {
    year: current.year,
    seasonType: current.seasonType,
    week: current.week,
    isCurrentWeek: !isOffSeason,
    isOffSeason,
    displayText: current.displayName,
  };
};

/**
 * Whether an instant falls inside the estimated NFL season (preseason through
 * the Super Bowl).
 *
 * @param {Date|number|string} [dateLike] defaults to now
 * @returns {boolean}
 */
export const isNFLSeason = (dateLike = new Date()) =>
  !getCurrentNFLWeek(dateLike).isOffSeason;

export default {
  getCurrentNFLWeek,
  getDefaultNFLSelection,
  getNFLSeasonYear,
  getNFLRegularSeasonStart,
  isNFLSeason,
};
