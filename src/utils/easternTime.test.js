/**
 * Sanity coverage for the Eastern-Time helpers.
 *
 * The exhaustive Property 5 coverage lives in the property test added by task
 * 6.2; this file pins the concrete cases the helpers exist for, including the
 * instants where the ET calendar date differs from the UTC one.
 *
 * Requirements: 3.3, 3.4, 3.5
 */
import {
  EASTERN_TIME_ZONE,
  formatEasternDateRange,
  formatEasternMonthDay,
  formatEasternWeekRangeLabel,
  formatEasternYyyymmdd,
  formatEasternYyyymmddFromEpochSeconds,
  fromEpochSeconds,
  getEasternDateParts,
  toDate,
} from "./easternTime";

const { getFixedTimeZone } = require("../../test/tz");

// 2024-09-09T02:00:00Z is still Sep 8 in ET (EDT, UTC-4).
const LATE_SUNDAY_NIGHT_ET = Date.parse("2024-09-09T02:00:00Z");
// 2024-09-09T13:00:00Z is Sep 9 in both UTC and ET.
const MONDAY_MORNING_ET = Date.parse("2024-09-09T13:00:00Z");
// 2025-01-13T04:30:00Z is still Jan 12 in ET (EST, UTC-5) — playoff window.
const PLAYOFF_NIGHT_ET = Date.parse("2025-01-13T04:30:00Z");

describe("easternTime", () => {
  it("runs under a fixed process.env.TZ", () => {
    expect(getFixedTimeZone()).toBe(process.env.TZ);
  });

  it("uses America/New_York as the boundary zone", () => {
    expect(EASTERN_TIME_ZONE).toBe("America/New_York");
  });

  describe("toDate / fromEpochSeconds", () => {
    it("accepts Date, epoch millis, and ISO strings", () => {
      const date = new Date(MONDAY_MORNING_ET);
      expect(toDate(date)).toBe(date);
      expect(toDate(MONDAY_MORNING_ET).getTime()).toBe(MONDAY_MORNING_ET);
      expect(toDate("2024-09-09T13:00:00Z").getTime()).toBe(MONDAY_MORNING_ET);
    });

    it("returns null for missing or unparseable input", () => {
      [null, undefined, "", "not-a-date", NaN, {}, true].forEach((input) => {
        expect(toDate(input)).toBeNull();
      });
    });

    it("converts epoch seconds without ambiguity", () => {
      expect(fromEpochSeconds(MONDAY_MORNING_ET / 1000).getTime()).toBe(
        MONDAY_MORNING_ET,
      );
      expect(fromEpochSeconds("1725886800").getTime()).toBe(1725886800 * 1000);
      expect(fromEpochSeconds(null)).toBeNull();
      expect(fromEpochSeconds("abc")).toBeNull();
    });
  });

  describe("getEasternDateParts", () => {
    it("reports the ET wall-clock fields for an instant", () => {
      expect(getEasternDateParts(LATE_SUNDAY_NIGHT_ET)).toEqual({
        year: 2024,
        month: 9,
        day: 8,
        hour: 22,
        minute: 0,
        second: 0,
      });
    });

    it("normalizes ET midnight to hour 0", () => {
      const parts = getEasternDateParts(Date.parse("2024-09-09T04:00:00Z"));
      expect(parts).toMatchObject({ month: 9, day: 9, hour: 0 });
    });

    it("returns null for an invalid instant", () => {
      expect(getEasternDateParts("nope")).toBeNull();
    });
  });

  describe("formatEasternYyyymmdd", () => {
    it("uses the ET calendar date, not the UTC one", () => {
      // UTC says Sep 9; ET (and therefore the odds query) says Sep 8.
      expect(formatEasternYyyymmdd(LATE_SUNDAY_NIGHT_ET)).toBe("20240908");
      expect(formatEasternYyyymmdd(MONDAY_MORNING_ET)).toBe("20240909");
      expect(formatEasternYyyymmdd(PLAYOFF_NIGHT_ET)).toBe("20250112");
    });

    it("zero-pads month and day", () => {
      expect(formatEasternYyyymmdd(Date.parse("2025-03-05T17:00:00Z"))).toBe(
        "20250305",
      );
    });

    it("formats from epoch seconds", () => {
      expect(
        formatEasternYyyymmddFromEpochSeconds(LATE_SUNDAY_NIGHT_ET / 1000),
      ).toBe("20240908");
      expect(formatEasternYyyymmddFromEpochSeconds(null)).toBeNull();
    });

    it("returns null for an invalid instant", () => {
      expect(formatEasternYyyymmdd(undefined)).toBeNull();
    });
  });

  describe("week-range labels", () => {
    it("formats both boundaries in ET", () => {
      expect(formatEasternMonthDay(LATE_SUNDAY_NIGHT_ET)).toBe("Sep 8");
      expect(
        formatEasternMonthDay(LATE_SUNDAY_NIGHT_ET, { includeYear: true }),
      ).toBe("Sep 8, 2024");
    });

    it("renders a Mon-Sun ET range", () => {
      const monday = Date.parse("2024-09-09T04:00:00Z"); // Mon 00:00 ET
      const sunday = Date.parse("2024-09-16T03:59:59Z"); // Sun 23:59:59 ET
      expect(formatEasternDateRange(monday, sunday)).toBe("Sep 9 - Sep 15");
    });

    it("accepts the epoch-second week shape returned by the range endpoints", () => {
      const week = {
        week: 2,
        start: Date.parse("2024-09-09T04:00:00Z") / 1000,
        end: Date.parse("2024-09-16T03:59:59Z") / 1000,
      };
      expect(formatEasternWeekRangeLabel(week)).toBe("Sep 9 - Sep 15");
      expect(formatEasternWeekRangeLabel(null)).toBeNull();
    });

    it("returns null when either boundary is invalid", () => {
      expect(formatEasternDateRange(MONDAY_MORNING_ET, null)).toBeNull();
      expect(formatEasternDateRange(null, MONDAY_MORNING_ET)).toBeNull();
    });
  });
});
