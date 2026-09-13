/**
 * Timezone control helpers for tests.
 *
 * Timezone-sensitive tests must never depend on the machine's local zone.
 *
 * Mechanism: the ambient zone is fixed per Jest process via `process.env.TZ`.
 * `npm test` pins `TZ=UTC`; `npm run test:timezones` re-runs the whole suite
 * under several fixed zones east and west of Eastern Time. Reassigning
 * `process.env.TZ` at runtime does NOT work inside Jest (V8's timezone cache is
 * not re-armed for the test realm), so tests read the fixed zone rather than
 * trying to change it.
 *
 * For per-case zone variation, do not touch the ambient zone: pass zones/offsets
 * explicitly to the code under test, or compare against `offsetMinutesInZone`.
 * Production date formatting goes through `Intl.DateTimeFormat` with an explicit
 * `timeZone`, which is unaffected by the ambient zone.
 */

/** Fixed zones spanning offsets west of, at, and east of Eastern Time. */
const TIME_ZONES = {
  eastern: "America/New_York",
  westOfEastern: ["America/Los_Angeles", "America/Denver", "Pacific/Honolulu"],
  eastOfEastern: ["UTC", "Europe/Berlin", "Asia/Tokyo", "Australia/Sydney"],
};

const ALL_TIME_ZONES = [
  TIME_ZONES.eastern,
  ...TIME_ZONES.westOfEastern,
  ...TIME_ZONES.eastOfEastern,
];

/**
 * The zone this Jest process is pinned to. Throws if the suite was started
 * without a fixed TZ, so a test can never silently fall back to the machine zone.
 */
const getFixedTimeZone = () => {
  const timeZone = process.env.TZ;
  if (!timeZone) {
    throw new Error(
      "Tests must run under a fixed process.env.TZ (use `npm test`, which pins TZ=UTC).",
    );
  }
  return timeZone;
};

const PARTS_FORMAT_OPTIONS = {
  hour12: false,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
};

/**
 * UTC offset, in minutes, of `timeZone` at `instant` (positive east of UTC).
 * Computed with `Intl`, so the result is independent of the ambient zone.
 *
 * @param {string} timeZone IANA zone name
 * @param {number|Date} instant epoch millis or Date
 * @returns {number}
 */
const offsetMinutesInZone = (timeZone, instant) => {
  const date = instant instanceof Date ? instant : new Date(instant);
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    ...PARTS_FORMAT_OPTIONS,
  })
    .formatToParts(date)
    .reduce((acc, part) => {
      if (part.type !== "literal") {
        acc[part.type] = Number(part.value);
      }
      return acc;
    }, {});

  const asUTC = Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour === 24 ? 0 : parts.hour,
    parts.minute,
    parts.second,
  );

  return Math.round((asUTC - date.getTime()) / 60000);
};

/** UTC offset, in minutes, of the ambient (pinned) zone at `instant`. */
const ambientOffsetMinutes = (instant) => {
  const date = instant instanceof Date ? instant : new Date(instant);
  // `0 - x` rather than `-x` so a zero offset stays +0 and compares equal.
  return 0 - date.getTimezoneOffset();
};

module.exports = {
  TIME_ZONES,
  ALL_TIME_ZONES,
  getFixedTimeZone,
  offsetMinutesInZone,
  ambientOffsetMinutes,
};
