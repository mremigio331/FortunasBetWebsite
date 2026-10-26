/**
 * Browser-local datetime display helpers.
 *
 * These are for DISPLAY of absolute instants (game start time, bet placement
 * time) in the viewer's own timezone — distinct from `easternTime.js`, which
 * pins week-boundary math to Eastern Time regardless of the viewer's zone.
 * Game start and bet placement are real instants, so each viewer should see
 * them in their own browser timezone.
 *
 * Inputs are epoch SECONDS (the unit the API returns for `event_datetime` and
 * `submitted_at`). `Intl.DateTimeFormat` with no `timeZone` uses the browser's
 * resolved zone.
 */

/** The viewer's resolved IANA timezone, e.g. "America/Los_Angeles". */
export const getBrowserTimeZone = () => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "";
  } catch {
    return "";
  }
};

/** A short timezone abbreviation for the viewer's zone, e.g. "PDT". */
export const getBrowserTimeZoneLabel = (epochSeconds = Date.now() / 1000) => {
  const d = toDateFromEpochSeconds(epochSeconds);
  if (!d) return "";
  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZoneName: "short",
    }).formatToParts(d);
    const tz = parts.find((p) => p.type === "timeZoneName");
    return tz ? tz.value : "";
  } catch {
    return "";
  }
};

/** Coerce epoch seconds (number or numeric string) to a Date, or null. */
export const toDateFromEpochSeconds = (epochSeconds) => {
  const n =
    typeof epochSeconds === "string" ? Number(epochSeconds) : epochSeconds;
  if (typeof n !== "number" || !Number.isFinite(n)) return null;
  const d = new Date(n * 1000);
  return Number.isNaN(d.getTime()) ? null : d;
};

/**
 * Full date + time in the viewer's browser timezone, e.g.
 * "Sun, Sep 8, 1:25 PM PDT".
 *
 * @param {number|string} epochSeconds
 * @param {{includeYear?: boolean, includeTimeZone?: boolean, includeWeekday?: boolean}} [options]
 * @returns {string|null} null when the input is not a valid instant
 */
export const formatBrowserDateTime = (epochSeconds, options = {}) => {
  const {
    includeYear = false,
    includeTimeZone = true,
    includeWeekday = true,
  } = options;
  const d = toDateFromEpochSeconds(epochSeconds);
  if (!d) return null;

  return new Intl.DateTimeFormat("en-US", {
    ...(includeWeekday ? { weekday: "short" } : {}),
    month: "short",
    day: "numeric",
    ...(includeYear ? { year: "numeric" } : {}),
    hour: "numeric",
    minute: "2-digit",
    ...(includeTimeZone ? { timeZoneName: "short" } : {}),
  }).format(d);
};

/**
 * Date only, in the viewer's browser timezone, e.g. "Sep 8, 2024".
 *
 * @param {number|string} epochSeconds
 * @param {{includeYear?: boolean}} [options]
 * @returns {string|null}
 */
export const formatBrowserDate = (epochSeconds, options = {}) => {
  const { includeYear = true } = options;
  const d = toDateFromEpochSeconds(epochSeconds);
  if (!d) return null;

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    ...(includeYear ? { year: "numeric" } : {}),
  }).format(d);
};

export default {
  getBrowserTimeZone,
  getBrowserTimeZoneLabel,
  toDateFromEpochSeconds,
  formatBrowserDateTime,
  formatBrowserDate,
};
