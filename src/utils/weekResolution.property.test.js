/**
 * @jest-environment node
 */

/**
 * Property-based coverage for the shared Week Resolution algorithm.
 *
 * Feature: current-week-selection-fix, Property 6: For any Room_Week_Range and
 * any present moment, Week_Resolution SHALL select the week that contains the
 * present moment; if none contains it, the chronologically nearest upcoming
 * week; if none is upcoming, the most recent past week; the selected week SHALL
 * always lie within the Room_Week_Range; and the NFL and MLB resolvers SHALL
 * return the same selection for equivalent inputs.
 *
 * **Validates: Requirements 1.6, 4.1, 4.2, 4.3, 4.4, 4.5, 6.4, 8.6**
 */
import fc from "fast-check";

import { WEEK_MATCH, resolveWeekSelection } from "./weekResolution";

const WEEK_SECONDS = 7 * 24 * 60 * 60;
/** Mon 00:00:00 EDT — the shape the ET range endpoints emit. */
const RANGE_ORIGIN = Date.parse("2024-09-02T04:00:00Z") / 1000;
/** Week numbers the generated ranges never contain, so identity misses are real. */
const ABSENT_WEEK_RANGE = { min: 900, max: 999 };

/**
 * Build a Room_Week_Range as consecutive Mon-Sun periods numbered from 1, where
 * `gaps[i]` whole weeks are skipped after period `i`. Gaps let the generator
 * place the present moment between weeks, which is the case that separates
 * "containing" from "nearest upcoming".
 */
const buildPeriods = (weekCount, gaps) => {
  const periods = [];
  let cursor = RANGE_ORIGIN;
  for (let index = 0; index < weekCount; index += 1) {
    const start = cursor;
    const end = start + WEEK_SECONDS - 1;
    periods.push({ week: index + 1, start, end });
    cursor = end + 1 + (gaps[index] || 0) * WEEK_SECONDS;
  }
  return periods;
};

/** Instants that exercise every branch: inside, on a boundary, in a gap, outside. */
const presentMomentArb = (periods) => {
  const first = periods[0];
  const last = periods[periods.length - 1];

  const gapIntervals = [];
  for (let index = 0; index < periods.length - 1; index += 1) {
    const gapStart = periods[index].end + 1;
    const gapEnd = periods[index + 1].start - 1;
    if (gapEnd >= gapStart) gapIntervals.push([gapStart, gapEnd]);
  }

  const candidates = [
    // Inside a week, including both inclusive boundaries.
    fc
      .tuple(
        fc.nat({ max: periods.length - 1 }),
        fc.oneof(
          fc.constant(0),
          fc.constant(WEEK_SECONDS - 1),
          fc.integer({ min: 0, max: WEEK_SECONDS - 1 }),
        ),
      )
      .map(([index, offset]) => periods[index].start + offset),
    // Entirely before the range -> nearest upcoming.
    fc
      .integer({ min: 1, max: 5 * WEEK_SECONDS })
      .map((delta) => first.start - delta),
    // Entirely after the range -> most recent past.
    fc
      .integer({ min: 1, max: 5 * WEEK_SECONDS })
      .map((delta) => last.end + delta),
    // Anywhere in a window a little wider than the range.
    fc.integer({
      min: first.start - WEEK_SECONDS,
      max: last.end + WEEK_SECONDS,
    }),
  ];

  if (gapIntervals.length > 0) {
    candidates.push(
      fc
        .constantFrom(...gapIntervals)
        .chain(([lo, hi]) => fc.integer({ min: lo, max: hi })),
    );
  }

  return fc.oneof(...candidates);
};

const scenarioArb = fc
  .record({
    weekCount: fc.integer({ min: 1, max: 8 }),
    gaps: fc.array(fc.integer({ min: 0, max: 3 }), {
      minLength: 8,
      maxLength: 8,
    }),
    seasonType: fc.constantFrom(1, 2, 3),
    year: fc.integer({ min: 2020, max: 2030 }),
    absentWeek: fc.integer(ABSENT_WEEK_RANGE),
  })
  .chain(({ weekCount, gaps, seasonType, year, absentWeek }) => {
    const periods = buildPeriods(weekCount, gaps);
    return fc.record({
      periods: fc.constant(periods),
      seasonType: fc.constant(seasonType),
      year: fc.constant(year),
      absentWeek: fc.constant(absentWeek),
      now: presentMomentArb(periods),
      // The wire never promises an order, so shuffle what the resolver receives.
      order: fc.shuffledSubarray(periods, {
        minLength: periods.length,
        maxLength: periods.length,
      }),
      // A week the range does contain, used as the reported Current_Week.
      reportedWeek: fc.constantFrom(...periods.map((period) => period.week)),
    });
  });

/**
 * Independent oracle for the ordering the design mandates: containing week,
 * else nearest upcoming, else most recent past.
 */
const expectedSelection = (periods, now) => {
  const chronological = [...periods].sort((a, b) => a.start - b.start);

  const containing = chronological.find(
    (period) => period.start <= now && now <= period.end,
  );
  if (containing) {
    return { week: containing.week, matchedBy: WEEK_MATCH.CONTAINING };
  }

  const upcoming = chronological.find((period) => period.start > now);
  if (upcoming) {
    return { week: upcoming.week, matchedBy: WEEK_MATCH.UPCOMING };
  }

  const past = chronological
    .filter((period) => period.end < now)
    .reduce(
      (best, period) =>
        best === null || period.end > best.end ? period : best,
      null,
    );
  return { week: past.week, matchedBy: WEEK_MATCH.PAST };
};

const toMlbWeeks = (order) =>
  order.map((period) => ({
    week: period.week,
    start: period.start,
    end: period.end,
    label: `Week ${period.week}`,
  }));

const toNflWeeks = (order, seasonType, year) =>
  order.map((period) => ({
    year,
    season_type: seasonType,
    season_name: "regular_season",
    week: period.week,
    week_start_epoch: period.start,
    week_end_epoch: period.end,
  }));

/** The selection must be one of the weeks that was handed in. */
const expectWithinRange = (result, inputWeeks, periods) => {
  expect(inputWeeks).toContain(result.selectedWeek.raw);
  expect(result.weeks).toContain(result.selectedWeek);
  expect(periods.map((period) => period.week)).toContain(result.selection.week);
  expect(result.selectedWeek.start).toBeGreaterThanOrEqual(
    Math.min(...periods.map((period) => period.start)),
  );
  expect(result.selectedWeek.end).toBeLessThanOrEqual(
    Math.max(...periods.map((period) => period.end)),
  );
};

/** Equivalent NFL and MLB inputs must land on the same period. */
const expectEquivalent = (nfl, mlb) => {
  expect(nfl.selection.week).toBe(mlb.selection.week);
  expect(nfl.matchedBy).toBe(mlb.matchedBy);
  expect(nfl.selectedWeek.start).toBe(mlb.selectedWeek.start);
  expect(nfl.selectedWeek.end).toBe(mlb.selectedWeek.end);
  expect(nfl.isCurrentWeekInRange).toBe(mlb.isCurrentWeekInRange);
  expect(nfl.isCurrentWeekOutOfRange).toBe(mlb.isCurrentWeekOutOfRange);
};

describe("weekResolution property 6", () => {
  it("selects the containing week, else the nearest upcoming, else the most recent past — always in range, and identically for NFL and MLB", () => {
    fc.assert(
      fc.property(scenarioArb, (scenario) => {
        const { periods, seasonType, year, absentWeek, now, order } = scenario;
        const { reportedWeek } = scenario;

        const mlbWeeks = toMlbWeeks(order);
        const nflWeeks = toNflWeeks(order, seasonType, year);
        const expected = expectedSelection(periods, now);

        // --- Ordering, resolved purely from the present moment (4.1-4.4) ---
        const mlb = resolveWeekSelection({ weeks: mlbWeeks, now });
        const nfl = resolveWeekSelection({ weeks: nflWeeks, now });

        expect(mlb.selection.week).toBe(expected.week);
        expect(mlb.matchedBy).toBe(expected.matchedBy);
        expect(nfl.selection.week).toBe(expected.week);
        expect(nfl.matchedBy).toBe(expected.matchedBy);

        // NFL carries the season identity of the week it picked.
        expect(nfl.selection.seasonType).toBe(seasonType);
        expect(nfl.selection.year).toBe(year);

        // The selection never escapes the Room_Week_Range (4.x, 6.4).
        expectWithinRange(mlb, mlbWeeks, periods);
        expectWithinRange(nfl, nflWeeks, periods);

        // Same ordering for both sports on equivalent inputs (4.5, 8.6).
        expectEquivalent(nfl, mlb);

        // With no reported Current_Week, coverage is decided by containment,
        // so anything but a containing match is flagged out-of-range (1.6).
        const isContaining = expected.matchedBy === WEEK_MATCH.CONTAINING;
        expect(mlb.isCurrentWeekInRange).toBe(isContaining);
        expect(mlb.isCurrentWeekOutOfRange).toBe(!isContaining);
        expect(mlb.hasRange).toBe(true);
        expect(mlb.isCurrentWeekKnown).toBe(true);

        // Turning off the Current_Week preference leaves ordering untouched.
        const mlbPure = resolveWeekSelection({
          weeks: mlbWeeks,
          now,
          currentWeek: { week: reportedWeek },
          preferCurrentWeek: false,
        });
        expect(mlbPure.selection.week).toBe(expected.week);
        expect(mlbPure.matchedBy).toBe(expected.matchedBy);

        // --- A reported Current_Week the range covers (1.1, 6.4) ---
        const mlbCovered = resolveWeekSelection({
          weeks: mlbWeeks,
          now,
          currentWeek: { week: reportedWeek },
        });
        const nflCovered = resolveWeekSelection({
          weeks: nflWeeks,
          now,
          // Strings, as ESPN reports them — matching must still be numeric.
          currentWeek: {
            week_value: String(reportedWeek),
            season_type_value: String(seasonType),
            season_year: year,
          },
        });

        expect(mlbCovered.selection.week).toBe(reportedWeek);
        expect(nflCovered.selection.week).toBe(reportedWeek);
        expect(mlbCovered.isCurrentWeekInRange).toBe(true);
        expect(mlbCovered.isCurrentWeekOutOfRange).toBe(false);
        expectWithinRange(mlbCovered, mlbWeeks, periods);
        expectWithinRange(nflCovered, nflWeeks, periods);
        expectEquivalent(nflCovered, mlbCovered);

        // --- A reported Current_Week outside the range (1.6, 6.4) ---
        const mlbOutside = resolveWeekSelection({
          weeks: mlbWeeks,
          now,
          currentWeek: { week: absentWeek },
        });
        const nflOutside = resolveWeekSelection({
          weeks: nflWeeks,
          now,
          currentWeek: {
            week_value: absentWeek,
            season_type_value: seasonType,
            season_year: year,
          },
        });

        // Flagged, but still clamped to a week inside the range.
        expect(mlbOutside.isCurrentWeekInRange).toBe(false);
        expect(mlbOutside.isCurrentWeekOutOfRange).toBe(true);
        expect(mlbOutside.selection.week).toBe(expected.week);
        expect(mlbOutside.matchedBy).toBe(expected.matchedBy);
        expectWithinRange(mlbOutside, mlbWeeks, periods);
        expectWithinRange(nflOutside, nflWeeks, periods);
        expectEquivalent(nflOutside, mlbOutside);
      }),
      { numRuns: 200 },
    );
  });
});
