/**
 * Property-based coverage for clearing pending bets when the week changes.
 *
 * Feature: current-week-selection-fix, Property 3: For any set of pending bet
 * selections, invoking a week change SHALL result in an empty pending bet
 * selection.
 *
 * **Validates: Requirements 2.4**
 *
 * This drives the *real* pending-bet state rather than a spy. `useBetSelection`
 * owns `selectedBets` — the pending selections the Room_Page submits — and hands
 * out `handleClearBets`, which is exactly what `Room.js` passes to
 * `createChangeHandlers`. Both hooks are rendered together in one `renderHook`
 * so the week-change handler closes over the genuine clearing function, and the
 * assertion is on the resulting state (`selectedBets`, `selectedBetsCount`,
 * `totalPoints`) rather than on a call count. A spy assertion would pass even if
 * `handleClearBets` stopped emptying the map; this cannot.
 *
 * `useBetSelection` calls `useQueryClient`, so the harness renders under a
 * `QueryClientProvider`. No query is ever issued: nothing here submits bets.
 *
 * The sibling suites `useNFLWeekSelection.test.js` and
 * `useMLBWeekSelection.test.js` cover the call-count form of Requirement 2.4 for
 * specific examples; this file covers the state form across arbitrary pending
 * sets, arbitrary target weeks, both sports, and every week-changing control.
 */

import { renderHook, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import fc from "fast-check";

import useBetSelection from "./useBetSelection";
import useMLBWeekSelection from "./useMLBWeekSelection";
import useNFLWeekSelection from "./useNFLWeekSelection";
import { getSportBettingRules } from "../../configs/sportConfig";
import { getSeasonTypeDisplayName } from "../../configs/nflSeasonTypes";

jest.mock("antd", () => ({
  __esModule: true,
  message: {
    info: jest.fn(),
    success: jest.fn(),
    error: jest.fn(),
    warning: jest.fn(),
  },
}));

// ---------------------------------------------------------------------------
// Fixtures — the range shapes the two sibling suites use.
// ---------------------------------------------------------------------------

const epochSeconds = (iso) => Math.floor(Date.parse(iso) / 1000);

/** A week entry in the shape `/odds/get_nfl_weeks_in_range` returns. */
const nflWeek = (year, seasonType, week, startIso, endIso) => ({
  year,
  season_type: seasonType,
  season_name: seasonType === 1 ? "preseason" : "regular_season",
  week,
  week_start: startIso,
  week_end: endIso,
  week_start_epoch: epochSeconds(startIso),
  week_end_epoch: epochSeconds(endIso),
});

/** A week entry in the shape `/odds/get_mlb_weeks_in_range` returns. */
const mlbWeek = (number, startIso, endIso) => ({
  week: number,
  start: epochSeconds(startIso),
  end: epochSeconds(endIso),
  label: `Week ${number}`,
});

// 2024 preseason weeks 1-2 and regular-season weeks 1-3, so a year or
// season-type change has somewhere to go.
const NFL_WEEKS = [
  nflWeek(2024, 1, 1, "2024-08-01T04:00:00Z", "2024-08-08T03:59:59Z"),
  nflWeek(2024, 1, 2, "2024-08-08T04:00:00Z", "2024-08-15T03:59:59Z"),
  nflWeek(2024, 2, 1, "2024-09-05T04:00:00Z", "2024-09-12T03:59:59Z"),
  nflWeek(2024, 2, 2, "2024-09-12T04:00:00Z", "2024-09-19T03:59:59Z"),
  nflWeek(2024, 2, 3, "2024-09-19T04:00:00Z", "2024-09-26T03:59:59Z"),
];

const MLB_WEEKS = [
  mlbWeek(1, "2024-07-01T04:00:00Z", "2024-07-08T03:59:59Z"),
  mlbWeek(2, "2024-07-08T04:00:00Z", "2024-07-15T03:59:59Z"),
  mlbWeek(3, "2024-07-15T04:00:00Z", "2024-07-22T03:59:59Z"),
];

/** Stand-in for the `useGetNFLWeeksInRange` return value. */
const nflRangeState = (nflWeeks) => {
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
    nflWeeks,
    availableSeasons: seasons,
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
  };
};

/** Stand-in for the `useGetMLBWeeksInRange` return value. */
const mlbRangeState = (availableWeeks) => ({
  availableWeeks,
  isMLBWeeksFetching: false,
  isMLBWeeksError: false,
  getWeekByNumber: (number) =>
    availableWeeks.find((entry) => entry.week === number) || null,
});

const NFL_ROOM = {
  start_date: NFL_WEEKS[0].week_start_epoch,
  end_date: NFL_WEEKS[4].week_end_epoch,
};
const MLB_ROOM = { start_date: MLB_WEEKS[0].start, end_date: MLB_WEEKS[2].end };

/** Mid Week 2 of each sport's fixture range, as absolute instants. */
const NFL_NOW = Date.parse("2024-09-15T18:00:00Z");
const MLB_NOW = Date.parse("2024-07-10T18:00:00Z");

// ---------------------------------------------------------------------------
// Harness — the real week-selection hook wired to the real pending-bet state.
// ---------------------------------------------------------------------------

/**
 * Mirrors how `Room.js` composes these hooks: both selection hooks run, the one
 * for the other sport is stood down with `room: null`, and the active one's
 * values feed `useBetSelection`. Both are called unconditionally so hook order
 * is stable across renders.
 */
const useRoomWeekAndBets = ({ sport }) => {
  const isMLB = sport === "MLB";

  const nfl = useNFLWeekSelection({
    room: isMLB ? null : NFL_ROOM,
    nflWeeksData: nflRangeState(NFL_WEEKS),
    now: NFL_NOW,
  });

  const mlb = useMLBWeekSelection({
    room: isMLB ? MLB_ROOM : null,
    mlbWeeksData: mlbRangeState(MLB_WEEKS),
    now: MLB_NOW,
  });

  const bets = useBetSelection({
    roomId: "room-1",
    currentUserId: "user-1",
    existingBets: [],
    selectedWeek: isMLB ? mlb.selectedWeekNumber : nfl.selectedWeek,
    selectedSeasonType: isMLB ? 2 : nfl.selectedSeasonType,
    selectedYear: isMLB ? 2024 : nfl.selectedYear,
    sport: isMLB ? "baseball" : "football",
    league: isMLB ? "mlb" : "nfl",
    roomSport: sport,
    nflOdds: [],
    createBet: () => Promise.resolve(),
    refetchBets: () => {},
  });

  return { selection: isMLB ? mlb : nfl, bets };
};

const wrapper = ({ children }) =>
  React.createElement(
    QueryClientProvider,
    {
      client: new QueryClient({
        defaultOptions: { queries: { retry: false } },
      }),
    },
    children,
  );

// ---------------------------------------------------------------------------
// Generators
// ---------------------------------------------------------------------------

/**
 * An arbitrary pending-bet map in the shape `useBetSelection` stores: game id ->
 * `{ betType, teamChoice, overUnderChoice, points }`. Sizes run from empty
 * through large, deliberately past `maxBetsPerWeek` — clearing must not depend
 * on the set being a legal week's worth of bets.
 */
const pendingBetsArb = (sport) =>
  fc.dictionary(
    fc.integer({ min: 0, max: 9999 }).map((n) => `game-${n}`),
    fc.record({
      betType: fc.constantFrom("spread", "overUnder"),
      teamChoice: fc.constantFrom("home", "away"),
      overUnderChoice: fc.constantFrom("over", "under"),
      points: fc.constantFrom(...getSportBettingRules(sport).allowedPoints),
    }),
    { minKeys: 0, maxKeys: 25 },
  );

/**
 * An arbitrary target week: in-range numbers, the string forms ESPN can hand
 * back, and weeks the room does not cover.
 */
const targetWeekArb = fc.oneof(
  fc.integer({ min: 1, max: 3 }),
  fc.integer({ min: 1, max: 3 }).map(String),
  fc.integer({ min: 4, max: 30 }),
);

/** Every control that changes which week's games are on screen. */
const changeArb = fc.oneof(
  fc.record({ kind: fc.constant("week"), value: targetWeekArb }),
  fc.record({
    kind: fc.constant("year"),
    value: fc.constantFrom(2024, "2024", 2023),
  }),
  fc.record({
    kind: fc.constant("seasonType"),
    value: fc.constantFrom(1, 2, 3, "1", "2"),
  }),
);

const scenarioArb = fc
  .record({
    sport: fc.constantFrom("NFL", "MLB"),
    change: changeArb,
  })
  .chain(({ sport, change }) =>
    fc.record({
      sport: fc.constant(sport),
      // MLB exposes only a week control, so a year/season-type draw collapses
      // to a week change there.
      change: fc.constant(
        sport === "MLB" && change.kind !== "week"
          ? { kind: "week", value: change.value }
          : change,
      ),
      pendingBets: pendingBetsArb(sport),
    }),
  );

// ---------------------------------------------------------------------------
// Property
// ---------------------------------------------------------------------------

describe("pending bets property 3", () => {
  it("empties the pending bet selection whenever the week changes, for any prior set of selections", () => {
    fc.assert(
      fc.property(scenarioArb, ({ sport, change, pendingBets }) => {
        const { result, unmount } = renderHook(
          () => useRoomWeekAndBets({ sport }),
          { wrapper },
        );

        try {
          // Seed the real pending-bet state.
          act(() => {
            result.current.bets.setSelectedBets(pendingBets);
          });

          // The seed took hold, so the post-change assertion is not vacuous.
          expect(result.current.bets.selectedBets).toEqual(pendingBets);
          expect(result.current.bets.selectedBetsCount).toBe(
            Object.keys(pendingBets).length,
          );

          // The week-change path, wired to the genuine clearing function exactly
          // as `Room.js` wires it.
          act(() => {
            const handlers = result.current.selection.createChangeHandlers(
              result.current.bets.handleClearBets,
            );
            if (change.kind === "week") {
              handlers.handleWeekChange(change.value);
            } else if (change.kind === "year") {
              handlers.handleYearChange(change.value);
            } else {
              handlers.handleSeasonTypeChange(change.value);
            }
          });

          // Requirement 2.4: nothing from the prior week survives the change.
          expect(result.current.bets.selectedBets).toEqual({});
          expect(result.current.bets.selectedBetsCount).toBe(0);
          expect(result.current.bets.totalPoints).toBe(0);

          // The change itself registered as a Deliberate_Selection, so this is
          // the user-driven path and not a no-op.
          expect(result.current.selection.hasUserSelected).toBe(true);
        } finally {
          unmount();
        }
      }),
      { numRuns: 150 },
    );
  });
});
