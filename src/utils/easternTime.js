/**
 * Eastern-Time date helpers.
 *
 * Every week boundary in this product is defined in Eastern Time (NFL ESPN
 * calendar weeks, MLB Mon 00:00:00 ET - Sun 23:59:59 ET). These helpers derive
 * calendar fields and display strings for an instant **in Eastern Time**, so the
 * result is identical no matter what zone the viewer's browser is in.
 *
 * Rules for this module:
 *   - pure: no ambient clock reads, no mutation, no side effects
 *   - never use browser-local accessors (`getFullYear`/`getMonth`/`getDate`) or
 *     the local `new Date(y, m, d)` constructor for calendar math
 *   - always pass an explicit `timeZone: "America/New_York"` to `Intl`
 *
 * Requirements: 3.3 (ET YYYYMMDD odds-query date), 3.4 (ET week-range label),
 * 3.5 (no browser-local date accessors).
 */

/** IANA zone all week boundary math is evaluated in. */
export const EASTERN_TIME_ZONE = "America/New_York";

const NUMERIC_PARTS_FORMATTER = new Intl.DateTimeFormat("en-US", {
  timeZone: EASTERN_TIME_ZONE,
  hour12: false,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
});

const MONTH_DAY_FORMATTER = new Intl.DateTimeFormat("en-US", {
  timeZone: EASTERN_TIME_ZONE,
  month: "short",
  day: "numeric",
});

const MONTH_DAY_YEAR_FORMATTER = new Intl.DateTimeFormat("en-US", {
  timeZone: EASTERN_TIME_ZONE,
  month: "short",
  day: "numeric",
  year: "numeric",
});

/**
 * Coerce a "date-like" value to a valid `Date`, or `null`.
 *
 * Accepted: `Date`, epoch **milliseconds**, or a parseable date string.
 * Epoch *seconds* are not auto-detected (1_700_000_000 is a legitimate millis
 * value); convert them explicitly with {@link fromEpochSeconds}.
 *
 * @param {Date|number|string|null|undefined} dateLike
 * @returns {Date|null}
 */
export const toDate = (dateLike) => {
  if (dateLike === null || dateLike === undefined || dateLike === "") {
    return null;
  }

  let date;
  if (dateLike instanceof Date) {
    date = dateLike;
  } else if (typeof dateLike === "number") {
    date = new Date(dateLike);
  } else if (typeof dateLike === "string") {
    date = new Date(dateLike);
  } else {
    return null;
  }

  return Number.isNaN(date.getTime()) ? null : date;
};

/**
 * Convert epoch seconds (the unit the week-range endpoints return) to a `Date`.
 *
 * @param {number|string|null|undefined} seconds
 * @returns {Date|null}
 */
export const fromEpochSeconds = (seconds) => {
  const numeric = typeof seconds === "string" ? Number(seconds) : seconds;
  if (typeof numeric !== "number" || !Number.isFinite(numeric)) return null;
  return toDate(numeric * 1000);
};

/**
 * Calendar fields of an instant **as seen in Eastern Time**.
 *
 * @param {Date|number|string} dateLike epoch millis, ISO string, or Date
 * @returns {{year: number, month: number, day: number, hour: number, minute: number, second: number}|null}
 *   `month` is 1-indexed. `null` when the input is not a valid instant.
 */
export const getEasternDateParts = (dateLike) => {
  const date = toDate(dateLike);
  if (!date) return null;

  const parts = NUMERIC_PARTS_FORMATTER.formatToParts(date).reduce(
    (acc, part) => {
      if (part.type !== "literal") {
        acc[part.type] = Number(part.value);
      }
      return acc;
    },
    {},
  );

  return {
    year: parts.year,
    month: parts.month,
    day: parts.day,
    // `hour12: false` can render midnight as hour 24 in some ICU versions.
    hour: parts.hour === 24 ? 0 : parts.hour,
    minute: parts.minute,
    second: parts.second,
  };
};

/**
 * `YYYYMMDD` for an instant's Eastern-Time calendar date. This is the date
 * format the odds queries take.
 *
 * @param {Date|number|string} dateLike epoch millis, ISO string, or Date
 * @returns {string|null} e.g. `"20240908"`, or `null` for an invalid instant
 */
export const formatEasternYyyymmdd = (dateLike) => {
  const parts = getEasternDateParts(dateLike);
  if (!parts) return null;

  const month = String(parts.month).padStart(2, "0");
  const day = String(parts.day).padStart(2, "0");
  return `${parts.year}${month}${day}`;
};

/**
 * `YYYYMMDD` for a week whose start boundary is given in epoch seconds.
 *
 * @param {number|string} startEpochSeconds
 * @returns {string|null}
 */
export const formatEasternYyyymmddFromEpochSeconds = (startEpochSeconds) =>
  formatEasternYyyymmdd(fromEpochSeconds(startEpochSeconds));

/**
 * Short Eastern-Time date for display, e.g. `"Sep 8"` (or `"Sep 8, 2024"`).
 *
 * @param {Date|number|string} dateLike epoch millis, ISO string, or Date
 * @param {{includeYear?: boolean}} [options]
 * @returns {string|null}
 */
export const formatEasternMonthDay = (dateLike, options = {}) => {
  const date = toDate(dateLike);
  if (!date) return null;

  return options.includeYear
    ? MONTH_DAY_YEAR_FORMATTER.format(date)
    : MONTH_DAY_FORMATTER.format(date);
};

/**
 * Eastern-Time date-range label for a week, e.g. `"Sep 8 - Sep 14"`.
 *
 * Both boundaries are formatted in Eastern Time so the label matches the ET
 * week boundaries the backend produced.
 *
 * @param {Date|number|string} startDateLike week start (epoch millis/ISO/Date)
 * @param {Date|number|string} endDateLike week end (epoch millis/ISO/Date)
 * @param {{includeYear?: boolean, separator?: string}} [options]
 * @returns {string|null} `null` when either boundary is invalid
 */
export const formatEasternDateRange = (
  startDateLike,
  endDateLike,
  options = {},
) => {
  const { includeYear = false, separator = " - " } = options;
  const start = formatEasternMonthDay(startDateLike, { includeYear });
  const end = formatEasternMonthDay(endDateLike, { includeYear });
  if (!start || !end) return null;

  return `${start}${separator}${end}`;
};

/**
 * Eastern-Time date-range label for a week given epoch-second boundaries — the
 * shape `/odds/get_mlb_weeks_in_range` and `/odds/get_nfl_weeks_in_range` return.
 *
 * @param {{start: number, end: number}} week
 * @param {{includeYear?: boolean, separator?: string}} [options]
 * @returns {string|null}
 */
export const formatEasternWeekRangeLabel = (week, options = {}) => {
  if (!week) return null;
  return formatEasternDateRange(
    fromEpochSeconds(week.start),
    fromEpochSeconds(week.end),
    options,
  );
};

export default {
  EASTERN_TIME_ZONE,
  toDate,
  fromEpochSeconds,
  getEasternDateParts,
  formatEasternYyyymmdd,
  formatEasternYyyymmddFromEpochSeconds,
  formatEasternMonthDay,
  formatEasternDateRange,
  formatEasternWeekRangeLabel,
};
