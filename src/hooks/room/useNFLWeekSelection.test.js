/**
 * `useNFLWeekSelection` — regression coverage for the defaulting bug.
 *
 * The behaviors pinned here are exactly the ones the old implementation got
 * wrong: it seeded the selection synchronously from client date math and then
 * gated every correction on the state being falsy, so an asynchronously-resolved
 * default was computed and discarded. These tests fail against that version.
 *
 * Tasks 7.2 / 7.3 / 7.4 add the property-based suites.
 *
 * _Requirements: 1.2, 1.3, 1.4, 1.5, 1.6, 2.1, 2.2, 2.3, 2.4, 6.2, 6.3, 6.4_
 */

import { renderHook, act } from "@testing-library/react";
import useNFLWeekSelection from "./useNFLWeekSelection";
import { getSeasonTypeDisplayName } from "../../configs/nflSeasonTypes";

jest.mock("antd", () => ({
  __esModule: true,
  message: { info: jest.fn(), success: jest.fn(), error: jest.fn() },
}));

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

// 2024 regular season, weeks 1-3: Thu 00:00 ET through the following Wed 23:59 ET.
const REG_WEEK_1 = nflWeek(
  2024,
  2,
  1,
  "2024-09-05T04:00:00Z",
  "2024-09-12T03:59:59Z",
);
const REG_WEEK_2 = nflWeek(
  2024,
  2,
  2,
  "2024-09-12T04:00:00Z",
  "2024-09-19T03:59:59Z",
);
const REG_WEEK_3 = nflWeek(
  2024,
  2,
  3,
  "2024-09-19T04:00:00Z",
  "2024-09-26T03:59:59Z",
);

// 2024 preseason, weeks 1-2, so a season-type change has somewhere to go.
const PRE_WEEK_1 = nflWeek(
  2024,
  1,
  1,
  "2024-08-01T04:00:00Z",
  "2024-08-08T03:59:59Z",
);
const PRE_WEEK_2 = nflWeek(
  2024,
  1,
  2,
  "2024-08-08T04:00:00Z",
  "2024-08-15T03:59:59Z",
);

const REGULAR_SEASON = [REG_WEEK_1, REG_WEEK_2, REG_WEEK_3];
const FULL_RANGE = [PRE_WEEK_1, PRE_WEEK_2, ...REGULAR_SEASON];

/** Mid Week 2 of the 2024 regular season, as an absolute instant. */
const DURING_WEEK_TWO = Date.parse("2024-09-15T18:00:00Z");

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

const ROOM = {
  start_date: PRE_WEEK_1.week_start_epoch,
  end_date: REG_WEEK_3.week_end_epoch,
};

describe("useNFLWeekSelection — adopt-on-resolve", () => {
  it("selects the week containing the present moment, not the first week", () => {
    const { result } = renderHook(() =>
      useNFLWeekSelection({
        room: ROOM,
        nflWeeksData: rangeState({ nflWeeks: FULL_RANGE }),
        now: DURING_WEEK_TWO,
      }),
    );

    expect(result.current.selectedWeek).toBe(2);
    expect(result.current.selectedSeasonType).toBe(2);
    expect(result.current.selectedYear).toBe(2024);
    expect(result.current.hasUserSelected).toBe(false);
  });

  it("reports loading and no week while the range is in flight", () => {
    const { result } = renderHook(() =>
      useNFLWeekSelection({
        room: ROOM,
        nflWeeksData: rangeState({ isNFLWeeksFetching: true }),
        isCurrentWeekLoading: true,
        now: DURING_WEEK_TWO,
      }),
    );

    expect(result.current.selectedWeek).toBeNull();
    expect(result.current.isWeekLoading).toBe(true);
  });

  it("adopts the resolved default when it arrives after the initial render", () => {
    const { result, rerender } = renderHook(
      (props) => useNFLWeekSelection(props),
      {
        initialProps: {
          room: ROOM,
          nflWeeksData: rangeState({ isNFLWeeksFetching: true }),
          isCurrentWeekLoading: true,
          now: DURING_WEEK_TWO,
        },
      },
    );

    expect(result.current.selectedWeek).toBeNull();

    rerender({
      room: ROOM,
      nflWeeksData: rangeState({ nflWeeks: FULL_RANGE }),
      isCurrentWeekLoading: false,
      now: DURING_WEEK_TWO,
    });

    expect(result.current.selectedWeek).toBe(2);
    expect(result.current.isWeekLoading).toBe(false);
  });

  it("adopts a later resolution even though the state already holds a week", () => {
    // The exact shape of the old bug: the state is already truthy when the real
    // default resolves. Adoption must still happen — it is gated on
    // `hasUserSelected` alone, never on the state being empty.
    const { result, rerender } = renderHook(
      (props) => useNFLWeekSelection(props),
      {
        initialProps: {
          room: ROOM,
          nflWeeksData: rangeState({ nflWeeks: [PRE_WEEK_1, PRE_WEEK_2] }),
          now: DURING_WEEK_TWO,
        },
      },
    );

    // Only the preseason is known, so the best available answer is its last week.
    expect(result.current.selectedSeasonType).toBe(1);
    expect(result.current.selectedWeek).toBe(2);

    rerender({
      room: ROOM,
      nflWeeksData: rangeState({ nflWeeks: FULL_RANGE }),
      now: DURING_WEEK_TWO,
    });

    expect(result.current.selectedWeek).toBe(2);
    expect(result.current.selectedSeasonType).toBe(2);
    expect(result.current.selectedYear).toBe(2024);
  });

  it("adopts the Current_Week reported by useCurrentWeek over the range's own reading", () => {
    const { result } = renderHook(() =>
      useNFLWeekSelection({
        room: ROOM,
        nflWeeksData: rangeState({ nflWeeks: FULL_RANGE }),
        currentWeek: { week: 3, seasonType: 2, year: 2024 },
        now: DURING_WEEK_TWO,
      }),
    );

    expect(result.current.selectedWeek).toBe(3);
    expect(result.current.selectedSeasonType).toBe(2);
    expect(result.current.selectedYear).toBe(2024);
  });

  it("falls back to the reported Current_Week when the room range is unavailable", () => {
    const { result } = renderHook(() =>
      useNFLWeekSelection({
        room: null,
        nflWeeksData: rangeState(),
        currentWeek: { week: 4, seasonType: 2, year: 2024 },
        isCurrentWeekEstimate: true,
        now: DURING_WEEK_TWO,
      }),
    );

    expect(result.current.selectedWeek).toBe(4);
    expect(result.current.selectedYear).toBe(2024);
    // An estimate, and the page is told so (Requirement 1.5).
    expect(result.current.isWeekEstimate).toBe(true);
  });
});

describe("useNFLWeekSelection — numeric normalization", () => {
  it("matches a string week value to its numeric dropdown option", () => {
    const { result } = renderHook(() =>
      useNFLWeekSelection({
        room: ROOM,
        nflWeeksData: rangeState({ nflWeeks: FULL_RANGE }),
        // ESPN expresses these as strings; cross-type `===` would leave the
        // controls blank (Requirements 6.1, 6.2, 6.3).
        currentWeek: { week: "3", seasonType: "2", year: "2024" },
        now: DURING_WEEK_TWO,
      }),
    );

    expect(result.current.selectedWeek).toBe(3);
    expect(result.current.selectedSeasonType).toBe(2);
    expect(result.current.selectedYear).toBe(2024);
    expect(result.current.weekOptions).toContain(3);
    expect(result.current.isCurrentWeekOutOfRange).toBe(false);
  });

  it("validates combinations by value rather than by strict equality", () => {
    const { result } = renderHook(() =>
      useNFLWeekSelection({
        room: ROOM,
        nflWeeksData: rangeState({ nflWeeks: FULL_RANGE }),
        now: DURING_WEEK_TWO,
      }),
    );

    expect(result.current.isValidCombination("2024", "2", "3")).toBe(true);
    expect(result.current.isValidCombination(2024, 2, 9)).toBe(false);
  });
});

describe("useNFLWeekSelection — out-of-range Current_Week", () => {
  it("selects the nearest in-range week and flags that the room misses it", () => {
    const { result } = renderHook(() =>
      useNFLWeekSelection({
        room: ROOM,
        nflWeeksData: rangeState({ nflWeeks: REGULAR_SEASON }),
        currentWeek: { week: 12, seasonType: 2, year: 2024 },
        now: Date.parse("2024-11-20T18:00:00Z"),
      }),
    );

    // Week 12 is not in this room's range: the most recent in-range week wins,
    // and the page is told the current week is not covered (Requirements 1.6, 6.4).
    expect(result.current.selectedWeek).toBe(3);
    expect(result.current.isCurrentWeekOutOfRange).toBe(true);
    expect(result.current.isWeekEstimate).toBe(true);
  });
});

describe("useNFLWeekSelection — deliberate selection", () => {
  it("keeps the user's week across a later resolution and a refetch", () => {
    const clearBets = jest.fn();
    const { result, rerender } = renderHook(
      (props) => useNFLWeekSelection(props),
      {
        initialProps: {
          room: ROOM,
          nflWeeksData: rangeState({ nflWeeks: FULL_RANGE }),
          currentWeek: { week: 2, seasonType: 2, year: 2024 },
          now: DURING_WEEK_TWO,
        },
      },
    );

    expect(result.current.selectedWeek).toBe(2);

    act(() => {
      result.current.createChangeHandlers(clearBets).handleWeekChange(1);
    });

    expect(result.current.selectedWeek).toBe(1);
    expect(result.current.hasUserSelected).toBe(true);
    // Requirement 2.4.
    expect(clearBets).toHaveBeenCalledTimes(1);

    // A window-focus refetch hands back a fresh payload object and a fresh range
    // array. Neither may move the selection (Requirements 2.2, 2.3).
    rerender({
      room: ROOM,
      nflWeeksData: rangeState({ nflWeeks: [...FULL_RANGE] }),
      currentWeek: { week: 2, seasonType: 2, year: 2024 },
      now: DURING_WEEK_TWO,
    });

    expect(result.current.selectedWeek).toBe(1);

    // Even when the refetch resolves to a *different* week, the user's choice holds.
    rerender({
      room: ROOM,
      nflWeeksData: rangeState({ nflWeeks: [...FULL_RANGE] }),
      currentWeek: { week: 3, seasonType: 2, year: 2024 },
      now: DURING_WEEK_TWO,
    });

    expect(result.current.selectedWeek).toBe(1);
    expect(result.current.resolvedSelection).toEqual({
      week: 3,
      seasonType: 2,
      year: 2024,
    });
  });

  it("clears pending bets on year and season-type changes too", () => {
    const clearBets = jest.fn();
    const { result } = renderHook(() =>
      useNFLWeekSelection({
        room: ROOM,
        nflWeeksData: rangeState({ nflWeeks: FULL_RANGE }),
        now: DURING_WEEK_TWO,
      }),
    );

    act(() => {
      result.current.createChangeHandlers(clearBets).handleYearChange(2024);
    });
    act(() => {
      result.current.createChangeHandlers(clearBets).handleSeasonTypeChange(1);
    });

    expect(clearBets).toHaveBeenCalledTimes(2);
    expect(result.current.hasUserSelected).toBe(true);
    expect(result.current.selectedSeasonType).toBe(1);
  });

  it("corrects a week that the user's season-type change made invalid", () => {
    const clearBets = jest.fn();
    const { result } = renderHook(() =>
      useNFLWeekSelection({
        room: ROOM,
        nflWeeksData: rangeState({ nflWeeks: FULL_RANGE }),
        now: DURING_WEEK_TWO,
      }),
    );

    act(() => {
      result.current.createChangeHandlers(clearBets).handleWeekChange(3);
    });
    expect(result.current.selectedWeek).toBe(3);

    // The preseason only has weeks 1-2, so week 3 cannot survive the switch;
    // the control must land on a real option rather than render blank.
    act(() => {
      result.current.createChangeHandlers(clearBets).handleSeasonTypeChange(1);
    });

    expect(result.current.weekOptions).toEqual([1, 2]);
    expect(result.current.selectedWeek).toBe(1);
  });
});
