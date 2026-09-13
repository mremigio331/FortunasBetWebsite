/**
 * Property-based coverage for NFL adopt-on-resolve.
 *
 * Feature: current-week-selection-fix, Property 1: For any provisional selection
 * state (empty or non-empty) and any asynchronously resolved default, when no
 * Deliberate_Selection has been made, the Week_Selection_State after the
 * resolution effect SHALL equal the resolved default.
 *
 * The generator always renders the hook in its unresolved state first and only
 * then hands it the resolved range and Current_Week, so every run exercises the
 * async-resolve-after-initial-render path (Requirement 8.1). Roughly half the
 * runs plant a provisional selection with the programmatic setters — which
 * deliberately do NOT record a Deliberate_Selection — so the state is non-empty
 * when the resolution lands. That is the exact shape of the old bug: adoption
 * must never be gated on the state being falsy (Requirement 1.3).
 *
 * **Validates: Requirements 1.2, 1.3, 8.1**
 */

import { renderHook, act } from "@testing-library/react";
import fc from "fast-check";
import useNFLWeekSelection from "./useNFLWeekSelection";
import { getSeasonTypeDisplayName } from "../../configs/nflSeasonTypes";

jest.mock("antd", () => ({
  __esModule: true,
  message: { info: jest.fn(), success: jest.fn(), error: jest.fn() },
}));

const SECOND_MS = 1000;
const WEEK_SECONDS = 7 * 24 * 60 * 60;
const WEEK_MS = WEEK_SECONDS * SECOND_MS;

/** Week numbers no generated range contains, so an out-of-range miss is real. */
const ABSENT_WEEK = { min: 90, max: 120 };

/** A week entry in the shape `/odds/get_nfl_weeks_in_range` returns. */
const nflWeek = (year, seasonType, week, startMs) => {
  const endMs = startMs + WEEK_MS - SECOND_MS;
  return {
    year,
    season_type: seasonType,
    season_name: seasonType === 1 ? "preseason" : "regular_season",
    week,
    week_start: new Date(startMs).toISOString(),
    week_end: new Date(endMs).toISOString(),
    week_start_epoch: Math.floor(startMs / SECOND_MS),
    week_end_epoch: Math.floor(endMs / SECOND_MS),
  };
};

/**
 * Consecutive preseason-then-regular-season weeks for one Season_Year, starting
 * at Aug 1 00:00 EDT. Built from `Date.UTC` rather than local date components so
 * the fixture is identical under every runtime zone.
 */
const buildRange = (year, preseasonWeeks, regularWeeks) => {
  const weeks = [];
  let cursor = Date.UTC(year, 7, 1, 4);
  const push = (seasonType, week) => {
    weeks.push(nflWeek(year, seasonType, week, cursor));
    cursor += WEEK_MS;
  };
  for (let week = 1; week <= preseasonWeeks; week += 1) push(1, week);
  for (let week = 1; week <= regularWeeks; week += 1) push(2, week);
  return weeks;
};

/**
 * Stand-in for the `useGetNFLWeeksInRange` return value, deriving its helpers
 * from the supplied weeks exactly as the real hook does.
 */
const rangeState = (overrides = {}) => {
  const nflWeeks = overrides.nflWeeks ?? [];

  const seasons = [];
  nflWeeks.forEach((entry) => {
    let season = seasons.find(
      (candidate) =>
        candidate.year === entry.year &&
        candidate.seasonType === entry.season_type,
    );
    if (!season) {
      season = {
        year: entry.year,
        seasonType: entry.season_type,
        seasonName: entry.season_name,
        availableWeeks: [],
        displayName: `${entry.year} ${getSeasonTypeDisplayName(entry.season_type)}`,
      };
      seasons.push(season);
    }
    season.availableWeeks.push(entry.week);
  });

  const getWeeksForYearAndSeason = (year, seasonType) => {
    const season = seasons.find(
      (candidate) =>
        candidate.year === year && candidate.seasonType === seasonType,
    );
    return season ? season.availableWeeks : [];
  };

  return {
    isNFLWeeksFetching: false,
    isNFLWeeksError: false,
    getSeasonTypesForYear: (year) =>
      seasons
        .filter((season) => season.year === year)
        .map((season) => ({
          seasonType: season.seasonType,
          seasonName: season.seasonName,
          displayName: getSeasonTypeDisplayName(season.seasonType),
          availableWeeks: season.availableWeeks,
        })),
    getWeeksForYearAndSeason,
    isValidCombination: (year, seasonType, week) =>
      getWeeksForYearAndSeason(year, seasonType).includes(week),
    ...overrides,
    nflWeeks,
    availableSeasons: seasons,
  };
};

const selectionOf = (result) => ({
  week: result.current.selectedWeek,
  seasonType: result.current.selectedSeasonType,
  year: result.current.selectedYear,
});

/**
 * A resolution scenario.
 *
 * `priorState` is the provisional selection planted before the resolution
 * arrives: `null` for the empty case, otherwise any subset of the three fields
 * (an empty object is also a legitimate draw — a state that stayed empty).
 */
const scenarioArb = fc.record({
  year: fc.integer({ min: 2020, max: 2030 }),
  preseasonWeeks: fc.integer({ min: 0, max: 4 }),
  regularWeeks: fc.integer({ min: 1, max: 18 }),
  // Which week contains the present moment, and where inside it "now" falls
  // (0 and WEEK_SECONDS - 1 are the inclusive boundaries).
  nowWeekIndex: fc.nat({ max: 30 }),
  nowOffsetSeconds: fc.integer({ min: 0, max: WEEK_SECONDS - 1 }),
  // How the Authoritative_Week_Source reports the Current_Week, if at all.
  currentWeekMode: fc.constantFrom(
    "absent",
    "inRange",
    "inRangeAsStrings",
    "outOfRange",
  ),
  currentWeekIndex: fc.nat({ max: 30 }),
  absentWeek: fc.integer(ABSENT_WEEK),
  // Whether the range itself resolves, or comes back empty so the reported
  // Current_Week is the only resolved default available.
  rangeResolves: fc.boolean(),
  priorState: fc.oneof(
    fc.constant(null),
    fc.record(
      {
        week: fc.integer({ min: 1, max: 25 }),
        seasonType: fc.constantFrom(1, 2, 3),
        year: fc.integer({ min: 2018, max: 2032 }),
      },
      { requiredKeys: [] },
    ),
  ),
});

describe("useNFLWeekSelection — Property 1: adopt-on-resolve", () => {
  it("lands on the resolved default from any prior provisional state", () => {
    // Coverage witnesses, checked after the run: a property that only ever drew
    // empty prior states would pass without saying anything about the bug.
    const seen = { emptyPrior: 0, nonEmptyPriorDisagreeing: 0 };

    fc.assert(
      fc.property(scenarioArb, (scenario) => {
        const weeks = buildRange(
          scenario.year,
          scenario.preseasonWeeks,
          scenario.regularWeeks,
        );

        const nowWeek = weeks[scenario.nowWeekIndex % weeks.length];
        const now =
          (nowWeek.week_start_epoch + scenario.nowOffsetSeconds) * SECOND_MS;

        const room = {
          start_date: weeks[0].week_start_epoch,
          end_date: weeks[weeks.length - 1].week_end_epoch,
        };

        // With no range to resolve against, the reported Current_Week is the only
        // possible default, so it must be present for the property to have an
        // asynchronously resolved default at all.
        const mode =
          !scenario.rangeResolves && scenario.currentWeekMode === "absent"
            ? "inRange"
            : scenario.currentWeekMode;

        const reportedWeek = weeks[scenario.currentWeekIndex % weeks.length];
        let currentWeek = null;
        if (mode === "inRange") {
          currentWeek = {
            week: reportedWeek.week,
            seasonType: reportedWeek.season_type,
            year: reportedWeek.year,
          };
        } else if (mode === "inRangeAsStrings") {
          // ESPN expresses these as strings; the resolved default is still numeric.
          currentWeek = {
            week: String(reportedWeek.week),
            seasonType: String(reportedWeek.season_type),
            year: String(reportedWeek.year),
          };
        } else if (mode === "outOfRange") {
          currentWeek = {
            week: scenario.absentWeek,
            seasonType: 2,
            year: scenario.year,
          };
        }

        // The default this scenario must land on, derived from the fixture rather
        // than from the hook: the reported Current_Week when the range covers it,
        // otherwise the week containing the present moment. With no range, the
        // reported Current_Week stands on its own.
        let expected;
        if (!scenario.rangeResolves) {
          expected = {
            week: Number(currentWeek.week),
            seasonType: Number(currentWeek.seasonType),
            year: Number(currentWeek.year),
          };
        } else if (mode === "inRange" || mode === "inRangeAsStrings") {
          expected = {
            week: reportedWeek.week,
            seasonType: reportedWeek.season_type,
            year: reportedWeek.year,
          };
        } else {
          expected = {
            week: nowWeek.week,
            seasonType: nowWeek.season_type,
            year: nowWeek.year,
          };
        }

        // 1. Unresolved: the range is in flight and the Current_Week is loading.
        const { result, rerender, unmount } = renderHook(
          (props) => useNFLWeekSelection(props),
          {
            initialProps: {
              room,
              nflWeeksData: rangeState({ isNFLWeeksFetching: true }),
              currentWeek: null,
              isCurrentWeekLoading: true,
              now,
            },
          },
        );

        try {
          expect(selectionOf(result)).toEqual({
            week: null,
            seasonType: null,
            year: null,
          });

          // 2. Optionally plant a provisional, non-deliberate selection.
          const prior = scenario.priorState;
          const isEmptyPrior = !prior || Object.keys(prior).length === 0;
          if (isEmptyPrior) {
            seen.emptyPrior += 1;
          } else if (
            prior.week !== expected.week ||
            prior.seasonType !== expected.seasonType ||
            prior.year !== expected.year
          ) {
            // A non-empty state that disagrees with the default: adoption has to
            // overwrite a truthy value, which is what the old gate refused to do.
            seen.nonEmptyPriorDisagreeing += 1;
          }
          if (prior) {
            act(() => {
              if (prior.week !== undefined) {
                result.current.setSelectedWeek(prior.week);
              }
              if (prior.seasonType !== undefined) {
                result.current.setSelectedSeasonType(prior.seasonType);
              }
              if (prior.year !== undefined) {
                result.current.setSelectedYear(prior.year);
              }
            });

            // The programmatic setters must not count as a Deliberate_Selection,
            // and the planted values must actually be in the state — otherwise the
            // "non-empty prior state" half of the property is vacuous.
            expect(result.current.hasUserSelected).toBe(false);
            if (prior.week !== undefined) {
              expect(result.current.selectedWeek).toBe(prior.week);
            }
            if (prior.seasonType !== undefined) {
              expect(result.current.selectedSeasonType).toBe(prior.seasonType);
            }
            if (prior.year !== undefined) {
              expect(result.current.selectedYear).toBe(prior.year);
            }
          }

          // 3. The default resolves.
          rerender({
            room,
            nflWeeksData: rangeState({
              nflWeeks: scenario.rangeResolves ? weeks : [],
            }),
            currentWeek,
            isCurrentWeekLoading: false,
            now,
          });

          expect(result.current.resolvedSelection).toEqual(expected);
          expect(selectionOf(result)).toEqual(expected);
          expect(result.current.hasUserSelected).toBe(false);
        } finally {
          unmount();
        }
      }),
      { numRuns: 200 },
    );

    expect(seen.emptyPrior).toBeGreaterThan(0);
    expect(seen.nonEmptyPriorDisagreeing).toBeGreaterThan(0);
  });
});
