/**
 * Property test for the Eastern-Time date helpers.
 *
 * Feature: current-week-selection-fix, Property 5: For any epoch timestamp, the
 * derived date string (both the YYYYMMDD odds-query date and the rendered
 * week-range label) SHALL reflect the calendar date of that instant in Eastern
 * Time, independent of the runtime's local time zone.
 *
 * Validates: Requirements 3.3, 3.4
 *
 * Ambient-zone independence: the expected ET calendar date is derived here
 * without ever reading the ambient zone — the ET offset comes from
 * `offsetMinutesInZone` (explicit `timeZone`, `Intl`-computed) and is applied to
 * the instant before reading `getUTC*` fields. The suite itself is pinned to a
 * fixed `process.env.TZ` (`npm test` pins UTC; `npm run test:timezones` re-runs
 * it under America/New_York, America/Los_Angeles and Asia/Tokyo), so this one
 * property passing under every pinned zone is the independence evidence.
 */
import fc from "fast-check";

import {
  formatEasternDateRange,
  formatEasternMonthDay,
  formatEasternWeekRangeLabel,
  formatEasternYyyymmdd,
  formatEasternYyyymmddFromEpochSeconds,
  getEasternDateParts,
} from "./easternTime";

const {
  TIME_ZONES,
  getFixedTimeZone,
  offsetMinutesInZone,
  ambientOffsetMinutes,
} = require("../../test/tz");

const MINUTE_MS = 60 * 1000;
const DAY_SECONDS = 24 * 60 * 60;

/** Epoch-second window covering every season this product can plausibly show. */
const MIN_EPOCH_SECONDS = Math.floor(Date.UTC(1990, 0, 1) / 1000);
const MAX_EPOCH_SECONDS = Math.floor(Date.UTC(2060, 0, 1) / 1000);

/**
 * Eastern-Time calendar fields for an instant, derived independently of both the
 * ambient zone and the helper under test: shift the instant by the ET offset,
 * then read UTC fields (which no ambient zone can influence).
 */
const expectedEasternParts = (epochMillis) => {
  const offsetMinutes = offsetMinutesInZone(TIME_ZONES.eastern, epochMillis);
  const shifted = new Date(epochMillis + offsetMinutes * MINUTE_MS);
  return {
    year: shifted.getUTCFullYear(),
    month: shifted.getUTCMonth() + 1,
    day: shifted.getUTCDate(),
    hour: shifted.getUTCHours(),
    minute: shifted.getUTCMinutes(),
    second: shifted.getUTCSeconds(),
  };
};

const expectedYyyymmdd = (epochMillis) => {
  const { year, month, day } = expectedEasternParts(epochMillis);
  return `${year}${String(month).padStart(2, "0")}${String(day).padStart(2, "0")}`;
};

/**
 * The display label the ET-shifted instant should render as. Formatting the
 * shifted instant in UTC keeps the expectation locale-faithful (so it does not
 * hard-code month abbreviations) while staying ambient-zone independent.
 */
const expectedMonthDay = (epochMillis, includeYear) => {
  const offsetMinutes = offsetMinutesInZone(TIME_ZONES.eastern, epochMillis);
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "UTC",
    month: "short",
    day: "numeric",
    ...(includeYear ? { year: "numeric" } : {}),
  }).format(new Date(epochMillis + offsetMinutes * MINUTE_MS));
};

/** The YYYYMMDD an ambient-local (buggy) implementation would have produced. */
const ambientYyyymmdd = (epochMillis) => {
  const offsetMinutes = ambientOffsetMinutes(epochMillis);
  const shifted = new Date(epochMillis + offsetMinutes * MINUTE_MS);
  return `${shifted.getUTCFullYear()}${String(shifted.getUTCMonth() + 1).padStart(2, "0")}${String(
    shifted.getUTCDate(),
  ).padStart(2, "0")}`;
};

describe("easternTime — Property 5: Eastern-Time date formatting", () => {
  it("derives YYYYMMDD odds dates and week-range labels from the Eastern-Time calendar date of any instant", () => {
    // Instants where the ambient zone disagrees with ET about the calendar date
    // are the ones that would catch a browser-local implementation. Track them
    // so a pinned non-ET zone proves the divergence was actually exercised.
    let divergentFromAmbient = 0;

    fc.assert(
      fc.property(
        fc.integer({ min: MIN_EPOCH_SECONDS, max: MAX_EPOCH_SECONDS }),
        fc.integer({ min: 1, max: 30 * DAY_SECONDS }),
        fc.boolean(),
        (startEpochSeconds, durationSeconds, includeYear) => {
          const endEpochSeconds = startEpochSeconds + durationSeconds;
          const startMillis = startEpochSeconds * 1000;
          const endMillis = endEpochSeconds * 1000;

          // Requirement 3.3 — the YYYYMMDD odds-query date is the ET date.
          const expectedStartDate = expectedYyyymmdd(startMillis);
          expect(formatEasternYyyymmdd(startMillis)).toBe(expectedStartDate);
          expect(formatEasternYyyymmdd(new Date(startMillis))).toBe(
            expectedStartDate,
          );
          expect(formatEasternYyyymmddFromEpochSeconds(startEpochSeconds)).toBe(
            expectedStartDate,
          );
          expect(getEasternDateParts(startMillis)).toEqual(
            expectedEasternParts(startMillis),
          );

          if (ambientYyyymmdd(startMillis) !== expectedStartDate) {
            divergentFromAmbient += 1;
          }

          // Requirement 3.4 — both boundaries of the rendered week-range label
          // are the ET dates of those instants.
          const expectedStartLabel = expectedMonthDay(startMillis, includeYear);
          const expectedEndLabel = expectedMonthDay(endMillis, includeYear);
          const expectedRange = `${expectedStartLabel} - ${expectedEndLabel}`;

          expect(formatEasternMonthDay(startMillis, { includeYear })).toBe(
            expectedStartLabel,
          );
          expect(
            formatEasternDateRange(startMillis, endMillis, { includeYear }),
          ).toBe(expectedRange);
          expect(
            formatEasternWeekRangeLabel(
              { start: startEpochSeconds, end: endEpochSeconds },
              { includeYear },
            ),
          ).toBe(expectedRange);
        },
      ),
      { numRuns: 200 },
    );

    if (getFixedTimeZone() !== TIME_ZONES.eastern) {
      expect(divergentFromAmbient).toBeGreaterThan(0);
    }
  });
});
