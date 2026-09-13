/**
 * @jest-environment node
 */

/**
 * Timezone-control smoke test.
 *
 * Proves the mechanism the Property 4 / Property 5 tests depend on:
 *   - the suite runs under a fixed `process.env.TZ`, so the ambient zone is the
 *     pinned zone and never the machine's local zone
 *   - Eastern-Time math done with an explicit `timeZone` is identical no matter
 *     which zone the suite is pinned to, including viewers east of and west of ET
 *
 * Supports Requirements 8.1, 8.2 (tooling prerequisite).
 */
import fc from "fast-check";

const {
  TIME_ZONES,
  ALL_TIME_ZONES,
  getFixedTimeZone,
  offsetMinutesInZone,
  ambientOffsetMinutes,
} = require("../../test/tz");

// 2024-09-08T18:00:00Z — NFL Week 1 Sunday afternoon (EDT, UTC-4).
const INSTANT = Date.parse("2024-09-08T18:00:00Z");

describe("timezone control", () => {
  it("runs under a fixed process.env.TZ", () => {
    expect(typeof process.env.TZ).toBe("string");
    expect(getFixedTimeZone()).toBe(process.env.TZ);
  });

  it("makes the ambient zone equal to the pinned zone", () => {
    expect(ambientOffsetMinutes(INSTANT)).toBe(
      offsetMinutesInZone(getFixedTimeZone(), INSTANT),
    );
  });

  it("computes Eastern-Time offsets independently of the ambient zone", () => {
    expect(offsetMinutesInZone(TIME_ZONES.eastern, INSTANT)).toBe(-240); // EDT
    expect(
      offsetMinutesInZone(
        TIME_ZONES.eastern,
        Date.parse("2025-01-12T18:00:00Z"),
      ),
    ).toBe(-300); // EST
  });

  it("covers viewers on both sides of Eastern Time", () => {
    const eastern = offsetMinutesInZone(TIME_ZONES.eastern, INSTANT);

    TIME_ZONES.westOfEastern.forEach((timeZone) => {
      expect(offsetMinutesInZone(timeZone, INSTANT)).toBeLessThan(eastern);
    });
    TIME_ZONES.eastOfEastern.forEach((timeZone) => {
      expect(offsetMinutesInZone(timeZone, INSTANT)).toBeGreaterThan(eastern);
    });
  });

  it("keeps explicit-zone formatting stable across generated viewer zones", () => {
    const formatEasternDate = (instant) =>
      new Intl.DateTimeFormat("en-CA", {
        timeZone: TIME_ZONES.eastern,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }).format(new Date(instant));

    fc.assert(
      fc.property(fc.constantFrom(...ALL_TIME_ZONES), (viewerZone) => {
        // A viewer's own zone shifts their wall clock, but the ET calendar date
        // for the same instant is fixed.
        expect(typeof offsetMinutesInZone(viewerZone, INSTANT)).toBe("number");
        expect(formatEasternDate(INSTANT)).toBe("2024-09-08");
      }),
      { numRuns: 100 },
    );
  });
});
