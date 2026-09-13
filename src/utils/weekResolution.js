/**
 * Week Resolution — the shared, pure algorithm that decides which week a room
 * should land on when it first loads.
 *
 * One implementation serves both NFL and MLB (Requirement 4.5): equivalent
 * inputs produce equal selections regardless of sport.
 *
 * Ordering (design.md "Week Resolution algorithm"):
 *   1. the week that contains the present moment
 *   2. else the chronologically nearest UPCOMING week
 *   3. else the most recent PAST week
 *
 * The returned week is always one of the weeks handed in, so the selection can
 * never fall outside the room's range. When the true current week is not
 * covered by the range, the result carries an out-of-range flag so the page can
 * say so instead of silently showing an unrelated week (Requirements 1.6, 6.4).
 *
 * Purity contract:
 *   - the present instant is an argument; this module never reads the clock
 *   - no local date-component accessors (`getFullYear`, `getMonth`, ...) and no
 *     local `Date` construction, so results do not drift by viewer time zone
 *     (Requirements 3.1, 3.2, 3.5)
 *   - week boundaries arrive as absolute epoch instants that the backend range
 *     endpoints already derived in Eastern Time; comparing absolute instants is
 *     timezone-invariant, which is what makes the resolution ET-correct
 *
 * Units: the algorithm is unit-agnostic. Week boundaries and the present
 * instant must share one timescale — epoch seconds (what
 * `/odds/get_mlb_weeks_in_range` and `/odds/get_nfl_weeks_in_range` return) or
 * epoch millis. Use {@link toEpochSeconds} to convert `Date.now()` when the
 * range is in seconds.
 *
 * Deliberate user selections are NOT handled here. The selection hooks gate on
 * their own `hasUserSelected` flag and simply skip calling this resolver (or
 * ignore its output) once the user has chosen a week (Requirements 2.1, 2.2).
 */

/** How the selected week was arrived at. */
export const WEEK_MATCH = {
  /** Matched the Current_Week reported by the Authoritative_Week_Source. */
  AUTHORITATIVE: "authoritative",
  /** The week whose boundaries contain the present moment. */
  CONTAINING: "containing",
  /** Chronologically nearest week that starts after the present moment. */
  UPCOMING: "upcoming",
  /** Most recent week that ended before the present moment. */
  PAST: "past",
  /** No time-based match was possible (empty range, or unknown instant). */
  NONE: "none",
};

const START_KEYS = ["start", "week_start_epoch", "startEpoch", "start_epoch"];
const END_KEYS = ["end", "week_end_epoch", "endEpoch", "end_epoch"];
const WEEK_KEYS = ["week", "week_value", "weekNumber", "week_number"];
const SEASON_TYPE_KEYS = ["seasonType", "season_type", "season_type_value"];
const YEAR_KEYS = ["year", "season_year", "seasonYear"];
const LABEL_KEYS = ["label", "week_label", "weekLabel"];

/**
 * Coerce a value to a finite number, or `null` when it cannot be one.
 *
 * Accepts numeric strings so that string week/season-type values coming off the
 * wire compare correctly against numeric dropdown options — never cross-type
 * strict equality (Requirements 6.1, 6.3).
 *
 * @param {*} value
 * @returns {number|null}
 */
export const toFiniteNumber = (value) => {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (trimmed === "") return null;
    const parsed = Number(trimmed);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
};

/** Convert epoch millis (e.g. `Date.now()`) to epoch seconds. */
export const toEpochSeconds = (epochMillis) => {
  const millis = toFiniteNumber(epochMillis);
  return millis === null ? null : Math.floor(millis / 1000);
};

const pickNumber = (source, keys) => {
  for (const key of keys) {
    const value = toFiniteNumber(source[key]);
    if (value !== null) return value;
  }
  return null;
};

const pickString = (source, keys) => {
  for (const key of keys) {
    const value = source[key];
    if (typeof value === "string" && value !== "") return value;
  }
  return null;
};

/**
 * @typedef {Object} NormalizedWeek
 * @property {number} start Inclusive lower boundary, epoch.
 * @property {number} end Inclusive upper boundary, epoch.
 * @property {number|null} week Week number.
 * @property {number|null} seasonType NFL season type (1 pre, 2 reg, 3 post).
 * @property {number|null} year NFL Season_Year.
 * @property {string|null} label Display label, when the source provided one.
 * @property {Object} raw The original entry, untouched.
 */

/**
 * Normalize a room's week range into a uniformly shaped, chronologically sorted
 * list. Accepts both wire shapes:
 *   - NFL: `{ year, season_type, week, week_start_epoch, week_end_epoch }`
 *   - MLB: `{ week, start, end, label }`
 *
 * Entries without usable numeric boundaries (or with `end` before `start`) are
 * dropped rather than allowed to poison the comparisons.
 *
 * @param {Array<Object>} weeks
 * @returns {NormalizedWeek[]}
 */
export const normalizeWeekRange = (weeks) => {
  if (!Array.isArray(weeks)) return [];

  return weeks
    .filter((entry) => entry && typeof entry === "object")
    .map((entry) => {
      const start = pickNumber(entry, START_KEYS);
      const end = pickNumber(entry, END_KEYS);
      if (start === null || end === null || end < start) return null;

      return {
        start,
        end,
        week: pickNumber(entry, WEEK_KEYS),
        seasonType: pickNumber(entry, SEASON_TYPE_KEYS),
        year: pickNumber(entry, YEAR_KEYS),
        label: pickString(entry, LABEL_KEYS),
        raw: entry,
      };
    })
    .filter(Boolean)
    .sort(compareWeeksChronologically);
};

/**
 * Chronological comparator: earlier start first, then earlier end, then lower
 * week number. Fully deterministic so overlapping or duplicated ranges resolve
 * the same way on every call.
 *
 * @param {NormalizedWeek} a
 * @param {NormalizedWeek} b
 * @returns {number}
 */
export function compareWeeksChronologically(a, b) {
  if (a.start !== b.start) return a.start - b.start;
  if (a.end !== b.end) return a.end - b.end;
  const weekA = a.week === null ? Number.POSITIVE_INFINITY : a.week;
  const weekB = b.week === null ? Number.POSITIVE_INFINITY : b.week;
  return weekA - weekB;
}

/**
 * @typedef {Object} WeekIdentity
 * @property {number|null} week
 * @property {number|null} seasonType
 * @property {number|null} year
 */

/**
 * Reduce a Current_Week payload (authoritative or fallback, either naming
 * convention) to a numeric identity. Returns `null` when nothing identifying is
 * present — e.g. an off-season payload whose week fields are all null.
 *
 * @param {Object|null|undefined} currentWeek
 * @returns {WeekIdentity|null}
 */
export const toWeekIdentity = (currentWeek) => {
  if (!currentWeek || typeof currentWeek !== "object") return null;

  const identity = {
    week: pickNumber(currentWeek, WEEK_KEYS),
    seasonType: pickNumber(currentWeek, SEASON_TYPE_KEYS),
    year: pickNumber(currentWeek, YEAR_KEYS),
  };

  const hasAnyField =
    identity.week !== null ||
    identity.seasonType !== null ||
    identity.year !== null;

  return hasAnyField ? identity : null;
};

/**
 * Does a range week correspond to the given identity? Only the fields the
 * identity actually specifies are compared, so MLB (week only) and NFL
 * (week + season type + year) both work. Comparison is numeric.
 *
 * @param {NormalizedWeek} week
 * @param {WeekIdentity|null} identity
 * @returns {boolean}
 */
export const weekMatchesIdentity = (week, identity) => {
  if (!week || !identity) return false;
  if (identity.week !== null && week.week !== identity.week) return false;
  if (identity.seasonType !== null && week.seasonType !== identity.seasonType) {
    return false;
  }
  if (identity.year !== null && week.year !== identity.year) return false;
  return true;
};

/**
 * The week whose inclusive boundaries contain `now`, or `null`.
 *
 * @param {NormalizedWeek[]} weeks chronologically sorted
 * @param {number} now epoch, same unit as the boundaries
 * @returns {NormalizedWeek|null}
 */
export const findContainingWeek = (weeks, now) => {
  const instant = toFiniteNumber(now);
  if (instant === null) return null;
  return (
    weeks.find((week) => week.start <= instant && instant <= week.end) || null
  );
};

/**
 * The chronologically nearest week that starts after `now`, or `null`.
 *
 * @param {NormalizedWeek[]} weeks chronologically sorted
 * @param {number} now epoch, same unit as the boundaries
 * @returns {NormalizedWeek|null}
 */
export const findNearestUpcomingWeek = (weeks, now) => {
  const instant = toFiniteNumber(now);
  if (instant === null) return null;
  // Sorted ascending by start, so the first future week is the nearest one.
  return weeks.find((week) => week.start > instant) || null;
};

/**
 * The most recent week that ended before `now`, or `null`.
 *
 * @param {NormalizedWeek[]} weeks chronologically sorted
 * @param {number} now epoch, same unit as the boundaries
 * @returns {NormalizedWeek|null}
 */
export const findMostRecentPastWeek = (weeks, now) => {
  const instant = toFiniteNumber(now);
  if (instant === null) return null;

  let mostRecent = null;
  weeks.forEach((week) => {
    if (week.end >= instant) return;
    if (
      mostRecent === null ||
      week.end > mostRecent.end ||
      (week.end === mostRecent.end && week.start > mostRecent.start)
    ) {
      mostRecent = week;
    }
  });
  return mostRecent;
};

const emptyResult = (weeks) => ({
  selectedWeek: null,
  selection: null,
  matchedBy: WEEK_MATCH.NONE,
  weeks,
  hasRange: false,
  isCurrentWeekKnown: false,
  isCurrentWeekInRange: false,
  isCurrentWeekOutOfRange: false,
});

const toSelection = (week) =>
  week === null
    ? null
    : { week: week.week, seasonType: week.seasonType, year: week.year };

/**
 * @typedef {Object} WeekResolutionResult
 * @property {NormalizedWeek|null} selectedWeek The week to display — always one
 *   of the supplied range weeks, or `null` only when the range is empty.
 * @property {{week: number|null, seasonType: number|null, year: number|null}|null} selection
 *   Numeric selection values ready to drop into Week_Selection_State.
 * @property {string} matchedBy One of {@link WEEK_MATCH}.
 * @property {NormalizedWeek[]} weeks The normalized, sorted range.
 * @property {boolean} hasRange Whether any usable week was supplied.
 * @property {boolean} isCurrentWeekKnown Whether the current week could be
 *   determined at all (a Current_Week identity or a present instant was given).
 * @property {boolean} isCurrentWeekInRange Whether the current week is covered
 *   by the range.
 * @property {boolean} isCurrentWeekOutOfRange Set when the current week is
 *   known but not covered by this room's range (Requirements 1.6, 6.4).
 */

/**
 * Resolve which week a room should display.
 *
 * @param {Object} params
 * @param {Array<Object>} params.weeks Room_Week_Range, either wire shape.
 * @param {number} params.now Present instant, same epoch unit as the
 *   boundaries. Always supplied by the caller — never read from the clock here.
 * @param {Object|null} [params.currentWeek] Current_Week from the
 *   Authoritative_Week_Source (or the fallback), used to honour the reported
 *   current week and to flag out-of-range.
 * @param {boolean} [params.preferCurrentWeek=true] When the reported
 *   Current_Week exists in the range, select it even if the range's own
 *   boundaries disagree about which week contains `now` (Requirement 1.1). Set
 *   `false` to resolve purely from the present moment.
 * @returns {WeekResolutionResult}
 */
export const resolveWeekSelection = ({
  weeks,
  now,
  currentWeek = null,
  preferCurrentWeek = true,
} = {}) => {
  const normalized = normalizeWeekRange(weeks);
  if (normalized.length === 0) return emptyResult(normalized);

  const instant = toFiniteNumber(now);
  const identity = toWeekIdentity(currentWeek);

  const authoritativeMatch = identity
    ? normalized.find((week) => weekMatchesIdentity(week, identity)) || null
    : null;
  const containing = findContainingWeek(normalized, instant);

  // Is the true current week covered by this room's range? When the
  // Authoritative_Week_Source told us which week is current, that identity
  // decides; otherwise the present moment does.
  const isCurrentWeekKnown = Boolean(identity) || instant !== null;
  const isCurrentWeekInRange = identity
    ? authoritativeMatch !== null
    : containing !== null;

  let selectedWeek = null;
  let matchedBy = WEEK_MATCH.NONE;

  if (preferCurrentWeek && authoritativeMatch !== null) {
    selectedWeek = authoritativeMatch;
    matchedBy =
      authoritativeMatch === containing
        ? WEEK_MATCH.CONTAINING
        : WEEK_MATCH.AUTHORITATIVE;
  } else if (containing !== null) {
    selectedWeek = containing;
    matchedBy = WEEK_MATCH.CONTAINING;
  } else {
    const upcoming = findNearestUpcomingWeek(normalized, instant);
    if (upcoming !== null) {
      selectedWeek = upcoming;
      matchedBy = WEEK_MATCH.UPCOMING;
    } else {
      const past = findMostRecentPastWeek(normalized, instant);
      if (past !== null) {
        selectedWeek = past;
        matchedBy = WEEK_MATCH.PAST;
      } else {
        // No usable instant: still return an in-range week rather than nothing.
        selectedWeek = normalized[0];
        matchedBy = WEEK_MATCH.NONE;
      }
    }
  }

  return {
    selectedWeek,
    selection: toSelection(selectedWeek),
    matchedBy,
    weeks: normalized,
    hasRange: true,
    isCurrentWeekKnown,
    isCurrentWeekInRange,
    isCurrentWeekOutOfRange: isCurrentWeekKnown && !isCurrentWeekInRange,
  };
};

export default resolveWeekSelection;
