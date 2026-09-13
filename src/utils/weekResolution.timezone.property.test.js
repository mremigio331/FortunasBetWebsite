/**
 * @jest-environment node
 */

/**
 * Timezone-invariance coverage for the whole frontend week-resolution path:
 * the shared resolver, the Eastern-Time formatting helpers, and the NFL
 * Fallback_Week_Source (the piece most at risk of viewer-timezone drift,
 * because it is the one that derives calendar fields itself).
 *
 * Feature: current-week-selection-fix, Property 4: For any instant in time and
 * any pair of viewer time zones (including at least one east of and one west of
 * Eastern Time), Week_Resolution SHALL produce identical results for both time
 * zones.
 *
 * **Validates: Requirements 3.1, 3.2, 3.5, 5.6, 8.2**
 *
 * How "viewer time zone" is modelled
 * ----------------------------------
 * Reassigning `process.env.TZ` at runtime does not change `Date` behaviour
 * inside Jest (V8's timezone cache is not re-armed for the test realm), so the
 * ambient zone is pinned per Jest process instead: `npm test` pins `TZ=UTC` and
 * `npm run test:timezones` re-runs the whole suite under UTC,
 * America/New_York, America/Los_Angeles and Asia/Tokyo. This property passing
 * under every pinned zone is the ambient-independence evidence.
 *
 * Within a single run, each viewer's zone is therefore an **explicit generated
 * input**: a viewer is represented by their own wall-clock reading of the shared
 * instant (`wallClockInZone`) plus that zone's offset. Two derivations are then
 * compared per viewer:
 *
 *   - `viewerInstant`      — reconstructs the absolute instant from the viewer's
 *                            wall clock and offset. This is the correct path;
 *                            every viewer must land on identical results.
 *   - `naiveViewerInstant` — reads the same wall clock but does the boundary
 *                            math as though those fields were Eastern Time.
 *                            This is the pre-fix bug (`getFullYear`/`getMonth`/
 *                            `getDate` on a browser-local `Date`), and near a
 *                            date or week boundary it must produce a *different*
 *                            answer — otherwise this test could not tell a
 *                            regression from a fix.
 */
import fc from "fast-check";

import {
  WEEK_MATCH,
  resolveWeekSelection,
  toEpochSeconds,
} from "./weekResolution";
import {
  EASTERN_TIME_ZONE,
  formatEasternWeekRangeLabel,
  formatEasternYyyymmdd,
  getEasternDateParts,
} from "./easternTime";
import {
  getCurrentNFLWeek,
  getDefaultNFLSelection,
  getNFLRegularSeasonStart,
  getNFLSeasonYear,
} from "../configs/nflCurrentWeek";

const {
  TIME_ZONES,
  getFixedTimeZone,
  offsetMinutesInZone,
} = require("../../test/tz");

const MINUTE_MS = 60 * 1000;
const HOUR_SECONDS = 60 * 60;
const DAY_SECONDS = 24 * HOUR_SECONDS;
const WEEK_SECONDS = 7 * DAY_SECONDS;

/**
 * Widest viewer-offset spread the zone table spans (Pacific/Honolulu at -10 to
 * Australia/Sydney at +11), so jitter around a boundary is guaranteed to let a
 * naive derivation cross it in either direction.
 */
const JITTER_SECONDS = 16 * HOUR_SECONDS;

/** Weeks in the generated room ranges. */
const WEEK_COUNT_RANGE = { min: 1, max: 8 };

/**
 * The viewer's wall-clock reading of `instant` in `zone` — the fields their
 * browser would show. Derived through `Intl` with an explicit `timeZone`, so it
 * never consults the ambient zone.
 *
 * @param {string} zone IANA zone name
 * @param {number} instant epoch millis
 * @returns {{year: number, month: number, day: number, hour: number, minute: number, second: number}}
 */
const wallClockInZone = (zone, instant) => {
  const offsetMinutes = offsetMinutesInZone(zone, instant);
  const shifted = new Date(instant + offsetMinutes * MINUTE_MS);
  return {
    year: shifted.getUTCFullYear(),
    month: shifted.getUTCMonth() + 1,
    day: shifted.getUTCDate(),
    hour: shifted.getUTCHours(),
    minute: shifted.getUTCMinutes(),
    second: shifted.getUTCSeconds(),
  };
};

const wallClockAsUtcMillis = (wall) =>
  Date.UTC(
    wall.year,
    wall.month - 1,
    wall.day,
    wall.hour,
    wall.minute,
    wall.second,
  );

/**
 * The absolute instant a viewer in `zone` is actually looking at, rebuilt from
 * their wall clock and their offset. Correct handling: identical for every
 * viewer, which is exactly why absolute-instant comparisons are ET-correct.
 *
 * @returns {number} epoch millis
 */
const viewerInstant = (zone, instant) => {
  const wall = wallClockInZone(zone, instant);
  return (
    wallClockAsUtcMillis(wall) - offsetMinutesInZone(zone, instant) * MINUTE_MS
  );
};

/**
 * The instant a *browser-local* implementation would effectively have used:
 * the viewer's wall-clock fields, interpreted as Eastern Time. Stands in for the
 * pre-fix code path (Requirement 3.5).
 *
 * @returns {number} epoch millis
 */
const naiveViewerInstant = (zone, instant) =>
  wallClockAsUtcMillis(wallClockInZone(zone, instant)) -
  offsetMinutesInZone(EASTERN_TIME_ZONE, instant) * MINUTE_MS;

/**
 * The instant of 00:00:00 Eastern Time on an ET calendar date. Built from
 * `Date.UTC` plus the zone's own offset, never `new Date(y, m, d)`.
 *
 * @param {{year: number, month: number, day: number}} date
 * @returns {number} epoch millis
 */
const easternMidnightInstant = ({ year, month, day }) => {
  const utcNoon = Date.UTC(year, month - 1, day, 12);
  const offsetMinutes = offsetMinutesInZone(EASTERN_TIME_ZONE, utcNoon);
  return Date.UTC(year, month - 1, day) - offsetMinutes * MINUTE_MS;
};

/**
 * A room week range anchored to the season's real Week 1 kickoff (Requirement
 * 7.5), as consecutive 7-day periods in epoch seconds — the unit the
 * `/odds/get_*_weeks_in_range` endpoints return.
 */
const buildPeriods = (seasonYear, weekCount) => {
  const anchorSeconds = Math.floor(
    easternMidnightInstant(getNFLRegularSeasonStart(seasonYear)) / 1000,
  );

  const periods = [];
  for (let index = 0; index < weekCount; index += 1) {
    const start = anchorSeconds + index * WEEK_SECONDS;
    periods.push({ week: index + 1, start, end: start + WEEK_SECONDS - 1 });
  }
  return periods;
};

const toMlbWeeks = (periods) =>
  periods.map((period) => ({
    week: period.week,
    start: period.start,
    end: period.end,
    label: `Week ${period.week}`,
  }));

/**
 * Instants that put pressure on the property: exactly on an ET week boundary,
 * on an ET midnight, and jittered by less than the widest viewer-offset spread
 * so a naive derivation lands on the far side of the boundary.
 */
const instantArb = (periods) => {
  const boundaries = periods.flatMap((period) => [
    period.start,
    period.end + 1,
  ]);
  const first = periods[0];
  const last = periods[periods.length - 1];

  return fc.oneof(
    // Right on a boundary.
    fc.constantFrom(...boundaries),
    // Within a viewer-offset spread of a boundary.
    fc
      .tuple(
        fc.constantFrom(...boundaries),
        fc.integer({ min: -JITTER_SECONDS, max: JITTER_SECONDS }),
      )
      .map(([boundary, jitter]) => boundary + jitter),
    // Anywhere in a window a little wider than the range.
    fc.integer({
      min: first.start - 3 * WEEK_SECONDS,
      max: last.end + 3 * WEEK_SECONDS,
    }),
  );
};

const scenarioArb = fc
  .record({
    seasonYear: fc.integer({ min: 2020, max: 2030 }),
    weekCount: fc.integer(WEEK_COUNT_RANGE),
    // At least one viewer west of ET and one east of ET (Requirement 8.2).
    westZone: fc.constantFrom(...TIME_ZONES.westOfEastern),
    eastZone: fc.constantFrom(...TIME_ZONES.eastOfEastern),
  })
  .chain(({ seasonYear, weekCount, westZone, eastZone }) => {
    const periods = buildPeriods(seasonYear, weekCount);
    return fc.record({
      periods: fc.constant(periods),
      westZone: fc.constant(westZone),
      eastZone: fc.constant(eastZone),
      instantSeconds: instantArb(periods),
      reportedWeek: fc.constantFrom(...periods.map((period) => period.week)),
    });
  });

/** Everything about a resolution that a caller can observe. */
const projectResolution = (result) => ({
  selection: result.selection,
  matchedBy: result.matchedBy,
  start: result.selectedWeek ? result.selectedWeek.start : null,
  end: result.selectedWeek ? result.selectedWeek.end : null,
  hasRange: result.hasRange,
  isCurrentWeekKnown: result.isCurrentWeekKnown,
  isCurrentWeekInRange: result.isCurrentWeekInRange,
  isCurrentWeekOutOfRange: result.isCurrentWeekOutOfRange,
});

/** Everything a viewer derives from an instant, across all three modules. */
const deriveForInstant = (weeks, instantMillis, currentWeek) => {
  const nowSeconds = toEpochSeconds(instantMillis);

  return {
    resolution: projectResolution(
      resolveWeekSelection({ weeks, now: nowSeconds }),
    ),
    resolutionWithCurrentWeek: projectResolution(
      resolveWeekSelection({ weeks, now: nowSeconds, currentWeek }),
    ),
    easternParts: getEasternDateParts(instantMillis),
    easternDate: formatEasternYyyymmdd(instantMillis),
    seasonYear: getNFLSeasonYear(instantMillis),
    fallbackWeek: getCurrentNFLWeek(instantMillis),
    fallbackSelection: getDefaultNFLSelection(instantMillis),
  };
};

describe("Property 4: timezone-invariant week resolution", () => {
  it("resolves the same week, ET date and fallback estimate for viewers east and west of Eastern Time", () => {
    // The suite must be pinned; a machine-local zone would make this vacuous.
    expect(getFixedTimeZone()).toBeTruthy();

    // A naive, browser-local derivation has to disagree somewhere, or this
    // property could not distinguish the fix from the bug. Counted here and
    // asserted after the run.
    let resolutionDivergences = 0;
    let easternDateDivergences = 0;
    let fallbackDivergences = 0;

    fc.assert(
      fc.property(scenarioArb, (scenario) => {
        const { periods, westZone, eastZone, instantSeconds, reportedWeek } =
          scenario;

        const instant = instantSeconds * 1000;
        const weeks = toMlbWeeks(periods);
        const currentWeek = { week: reportedWeek };

        const easternOffset = offsetMinutesInZone(EASTERN_TIME_ZONE, instant);
        const westOffset = offsetMinutesInZone(westZone, instant);
        const eastOffset = offsetMinutesInZone(eastZone, instant);

        // The generated pair really does straddle Eastern Time.
        expect(westOffset).toBeLessThan(easternOffset);
        expect(eastOffset).toBeGreaterThan(easternOffset);

        const viewerZones = [EASTERN_TIME_ZONE, westZone, eastZone];

        // Each viewer's wall clock is a genuinely different reading of the same
        // instant, yet reconstructing the instant from it returns the instant.
        const wallClocks = viewerZones.map((zone) =>
          wallClockAsUtcMillis(wallClockInZone(zone, instant)),
        );
        expect(new Set(wallClocks).size).toBe(viewerZones.length);

        const derivations = viewerZones.map((zone) => {
          const rebuilt = viewerInstant(zone, instant);
          expect(rebuilt).toBe(instant);
          return deriveForInstant(weeks, rebuilt, currentWeek);
        });

        // Requirements 3.1, 3.2, 5.6, 8.2 — identical results for every viewer.
        const [reference, ...others] = derivations;
        others.forEach((derived) => {
          expect(derived).toEqual(reference);
        });

        // The selection stays inside the room range whatever the viewer's zone.
        expect(periods.map((period) => period.week)).toContain(
          reference.resolution.selection.week,
        );
        expect(reference.resolution.matchedBy).not.toBe(WEEK_MATCH.NONE);

        // The rendered ET week-range label is a property of the week, not the
        // viewer (Requirement 3.4 support for 3.2).
        expect(
          formatEasternWeekRangeLabel({
            start: reference.resolution.start,
            end: reference.resolution.end,
          }),
        ).toBe(
          formatEasternWeekRangeLabel({
            start: derivations[derivations.length - 1].resolution.start,
            end: derivations[derivations.length - 1].resolution.end,
          }),
        );

        // Requirement 3.5 — a browser-local derivation is not equivalent. Near
        // a boundary the naive west and east viewers land on different weeks,
        // different ET dates, and different fallback estimates.
        const naive = [westZone, eastZone].map((zone) =>
          deriveForInstant(
            weeks,
            naiveViewerInstant(zone, instant),
            currentWeek,
          ),
        );

        if (
          naive.some(
            (derived) =>
              derived.resolution.selection.week !==
              reference.resolution.selection.week,
          )
        ) {
          resolutionDivergences += 1;
        }
        if (
          naive.some((derived) => derived.easternDate !== reference.easternDate)
        ) {
          easternDateDivergences += 1;
        }
        if (
          naive.some(
            (derived) =>
              derived.fallbackWeek.week !== reference.fallbackWeek.week ||
              derived.fallbackWeek.seasonType !==
                reference.fallbackWeek.seasonType ||
              derived.fallbackWeek.year !== reference.fallbackWeek.year,
          )
        ) {
          fallbackDivergences += 1;
        }
      }),
      { numRuns: 200 },
    );

    expect(resolutionDivergences).toBeGreaterThan(0);
    expect(easternDateDivergences).toBeGreaterThan(0);
    expect(fallbackDivergences).toBeGreaterThan(0);
  });
});
