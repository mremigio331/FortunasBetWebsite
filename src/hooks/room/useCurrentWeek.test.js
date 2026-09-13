/**
 * `useCurrentWeek` — smoke coverage for the single-source hook.
 *
 * Confirms the four states the contract promises: loading (no provisional week),
 * authoritative success normalized to numbers, failure/off-season falling back
 * to the ET estimate, and MLB resolving the containing week from the room range.
 *
 * The two data hooks are mocked so this suite exercises the resolution logic
 * without a network or React Query provider.
 *
 * _Requirements: 1.4, 1.5, 6.1, 7.1, 7.3_
 */

import { renderHook } from "@testing-library/react";
import useCurrentWeek, { MLB_SEASON_TYPE } from "./useCurrentWeek";
import useGetCurrentNflWeek from "../bet/useGetCurrentNflWeek";
import useGetMLBWeeksInRange from "../odds/useGetMLBWeeksInRange";
import { getDefaultNFLSelection } from "../../configs/nflCurrentWeek";
import { WEEK_MATCH } from "../../utils/weekResolution";

jest.mock("../bet/useGetCurrentNflWeek", () => ({
  __esModule: true,
  default: jest.fn(),
}));

jest.mock("../odds/useGetMLBWeeksInRange", () => ({
  __esModule: true,
  default: jest.fn(),
}));

const nflQueryState = (overrides = {}) => ({
  currentWeekInfo: {},
  isFetching: false,
  isError: false,
  status: "success",
  error: null,
  refetch: jest.fn(),
  ...overrides,
});

const mlbRangeState = (overrides = {}) => ({
  availableWeeks: [],
  isMLBWeeksFetching: false,
  isMLBWeeksError: false,
  ...overrides,
});

const epochSeconds = (iso) => Math.floor(Date.parse(iso) / 1000);

beforeEach(() => {
  useGetCurrentNflWeek.mockReturnValue(nflQueryState());
  useGetMLBWeeksInRange.mockReturnValue(mlbRangeState());
});

describe("useCurrentWeek — NFL", () => {
  it("reports loading without returning a provisional week", () => {
    useGetCurrentNflWeek.mockReturnValue(
      nflQueryState({ status: "loading", isFetching: true }),
    );

    const { result } = renderHook(() => useCurrentWeek("NFL"));

    expect(result.current.isLoading).toBe(true);
    expect(result.current.currentWeek).toBeNull();
    expect(result.current.isEstimate).toBe(false);
  });

  it("normalizes the authoritative payload to numbers", () => {
    useGetCurrentNflWeek.mockReturnValue(
      nflQueryState({
        currentWeekInfo: {
          is_off_season: false,
          season_year: "2024",
          season_type_value: "2",
          week_value: "12",
          week_label: "Week 12",
        },
      }),
    );

    const { result } = renderHook(() => useCurrentWeek("NFL"));

    expect(result.current.currentWeek).toEqual({
      week: 12,
      seasonType: 2,
      year: 2024,
    });
    expect(result.current.isLoading).toBe(false);
    expect(result.current.isEstimate).toBe(false);
    expect(result.current.isOffSeason).toBe(false);
  });

  it("falls back to the ET estimate when the request fails", () => {
    useGetCurrentNflWeek.mockReturnValue(
      nflQueryState({ status: "error", isError: true }),
    );

    const now = Date.parse("2024-10-16T18:00:00Z");
    const { result } = renderHook(() => useCurrentWeek("NFL", { now }));
    const fallback = getDefaultNFLSelection(new Date(now));

    expect(result.current.isEstimate).toBe(true);
    expect(result.current.isError).toBe(true);
    expect(result.current.currentWeek).toEqual({
      week: fallback.week,
      seasonType: fallback.seasonType,
      year: fallback.year,
    });
  });

  it("treats an off-season answer as an estimate", () => {
    useGetCurrentNflWeek.mockReturnValue(
      nflQueryState({
        currentWeekInfo: {
          is_off_season: true,
          season_year: null,
          season_type_value: null,
          week_value: null,
        },
      }),
    );

    const now = Date.parse("2024-06-15T18:00:00Z");
    const { result } = renderHook(() => useCurrentWeek("NFL", { now }));

    expect(result.current.isOffSeason).toBe(true);
    expect(result.current.isEstimate).toBe(true);
    expect(result.current.currentWeek.week).toBe(
      getDefaultNFLSelection(new Date(now)).week,
    );
  });
});

describe("useCurrentWeek — MLB", () => {
  const weeks = [
    {
      week: 1,
      start: epochSeconds("2024-07-01T04:00:00Z"),
      end: epochSeconds("2024-07-08T03:59:59Z"),
    },
    {
      week: 2,
      start: epochSeconds("2024-07-08T04:00:00Z"),
      end: epochSeconds("2024-07-15T03:59:59Z"),
    },
    {
      week: 3,
      start: epochSeconds("2024-07-15T04:00:00Z"),
      end: epochSeconds("2024-07-22T03:59:59Z"),
    },
  ];

  it("resolves the week containing the present moment, not week 1", () => {
    const { result } = renderHook(() =>
      useCurrentWeek("MLB", {
        mlbWeeksData: mlbRangeState({ availableWeeks: weeks }),
        now: Date.parse("2024-07-10T18:00:00Z"),
      }),
    );

    expect(result.current.currentWeek).toEqual({
      week: 2,
      seasonType: MLB_SEASON_TYPE,
      year: 2024,
    });
    expect(result.current.isLoading).toBe(false);
    expect(result.current.isEstimate).toBe(false);
  });

  it("flags an estimate when the room range does not cover now", () => {
    const { result } = renderHook(() =>
      useCurrentWeek("MLB", {
        mlbWeeksData: mlbRangeState({ availableWeeks: weeks }),
        now: Date.parse("2024-06-01T18:00:00Z"),
      }),
    );

    expect(result.current.currentWeek.week).toBe(1);
    expect(result.current.isEstimate).toBe(true);
  });

  it("reports loading while the room range is still fetching", () => {
    const { result } = renderHook(() =>
      useCurrentWeek("MLB", {
        mlbWeeksData: mlbRangeState({ isMLBWeeksFetching: true }),
      }),
    );

    expect(result.current.isLoading).toBe(true);
    expect(result.current.currentWeek).toBeNull();
  });

  it("does not consult the NFL authoritative source for MLB rooms", () => {
    renderHook(() =>
      useCurrentWeek("MLB", {
        mlbWeeksData: mlbRangeState({ availableWeeks: weeks }),
      }),
    );

    expect(useGetCurrentNflWeek).toHaveBeenCalledWith(false);
  });
});
/**
 * Extended coverage — the parts of the contract the smoke suite above leaves
 * open: the single-source posture (each sport touches exactly one source), the
 * `enabled` switch, inclusive MLB boundaries, an answered-but-unusable payload,
 * sport-argument handling, memoization stability, and the supplementary
 * `matchedBy` / `isError` fields.
 *
 * _Requirements: 1.4, 1.5, 7.1, 7.3_
 */

const RANGE_WEEKS = [
  {
    week: 1,
    start: epochSeconds("2024-07-01T04:00:00Z"),
    end: epochSeconds("2024-07-08T03:59:59Z"),
  },
  {
    week: 2,
    start: epochSeconds("2024-07-08T04:00:00Z"),
    end: epochSeconds("2024-07-15T03:59:59Z"),
  },
  {
    week: 3,
    start: epochSeconds("2024-07-15T04:00:00Z"),
    end: epochSeconds("2024-07-22T03:59:59Z"),
  },
];

/** Frozen so it can double as a stable reference across re-renders. */
const suppliedRange = mlbRangeState({ availableWeeks: RANGE_WEEKS });

const IN_SEASON_NOW = Date.parse("2024-10-16T18:00:00Z");

const authoritativeWeek = (overrides = {}) => ({
  is_off_season: false,
  season_year: 2024,
  season_type_value: 2,
  week_value: 7,
  ...overrides,
});

describe("useCurrentWeek — single source posture (Requirement 7.3)", () => {
  it("does not request the MLB range for an NFL room", () => {
    useGetCurrentNflWeek.mockReturnValue(
      nflQueryState({ currentWeekInfo: authoritativeWeek() }),
    );

    renderHook(() =>
      useCurrentWeek("NFL", {
        room: { start_date: 1719800000, end_date: 1721600000 },
      }),
    );

    expect(useGetCurrentNflWeek).toHaveBeenCalledWith(true);
    // A null range is how this hook stands the MLB query down.
    expect(useGetMLBWeeksInRange).toHaveBeenCalledWith(null, null);
  });

  it("fetches the room's MLB range itself when the caller supplies none", () => {
    useGetMLBWeeksInRange.mockReturnValue(
      mlbRangeState({ availableWeeks: RANGE_WEEKS }),
    );

    const room = {
      start_date: epochSeconds("2024-07-01T04:00:00Z"),
      end_date: epochSeconds("2024-07-22T03:59:59Z"),
    };

    const { result } = renderHook(() =>
      useCurrentWeek("MLB", {
        room,
        now: Date.parse("2024-07-10T18:00:00Z"),
      }),
    );

    expect(useGetMLBWeeksInRange).toHaveBeenCalledWith(
      room.start_date,
      room.end_date,
    );
    expect(result.current.currentWeek.week).toBe(2);
    expect(useGetCurrentNflWeek).toHaveBeenCalledWith(false);
  });

  it("skips its own range fetch when the caller supplies the range", () => {
    renderHook(() =>
      useCurrentWeek("MLB", {
        room: {
          start_date: epochSeconds("2024-07-01T04:00:00Z"),
          end_date: epochSeconds("2024-07-22T03:59:59Z"),
        },
        mlbWeeksData: suppliedRange,
        now: Date.parse("2024-07-10T18:00:00Z"),
      }),
    );

    expect(useGetMLBWeeksInRange).toHaveBeenCalledWith(null, null);
  });

  it("accepts a bare array of weeks as the supplied range", () => {
    const { result } = renderHook(() =>
      useCurrentWeek("MLB", {
        mlbWeeksData: RANGE_WEEKS,
        now: Date.parse("2024-07-17T18:00:00Z"),
      }),
    );

    expect(useGetMLBWeeksInRange).toHaveBeenCalledWith(null, null);
    expect(result.current.currentWeek.week).toBe(3);
  });
});

describe("useCurrentWeek — enabled: false", () => {
  it("stands both sources down and resolves nothing", () => {
    useGetCurrentNflWeek.mockReturnValue(
      nflQueryState({ currentWeekInfo: authoritativeWeek() }),
    );

    const { result } = renderHook(() =>
      useCurrentWeek("NFL", { enabled: false, now: IN_SEASON_NOW }),
    );

    expect(result.current).toEqual({
      currentWeek: null,
      isLoading: false,
      isEstimate: false,
      isOffSeason: false,
      matchedBy: WEEK_MATCH.NONE,
      isError: false,
    });
    expect(useGetCurrentNflWeek).toHaveBeenCalledWith(false);
    expect(useGetMLBWeeksInRange).toHaveBeenCalledWith(null, null);
  });

  it("stands the MLB range down too", () => {
    const { result } = renderHook(() =>
      useCurrentWeek("MLB", {
        enabled: false,
        room: {
          start_date: epochSeconds("2024-07-01T04:00:00Z"),
          end_date: epochSeconds("2024-07-22T03:59:59Z"),
        },
        now: Date.parse("2024-07-10T18:00:00Z"),
      }),
    );

    expect(result.current.currentWeek).toBeNull();
    expect(useGetMLBWeeksInRange).toHaveBeenCalledWith(null, null);
  });
});

describe("useCurrentWeek — MLB boundary instants", () => {
  const resolveAt = (iso) =>
    renderHook(() =>
      useCurrentWeek("MLB", {
        mlbWeeksData: suppliedRange,
        now: Date.parse(iso),
      }),
    ).result.current;

  it("treats a week's start boundary as inside that week", () => {
    const resolved = resolveAt("2024-07-08T04:00:00Z");

    expect(resolved.currentWeek.week).toBe(2);
    expect(resolved.matchedBy).toBe(WEEK_MATCH.CONTAINING);
    expect(resolved.isEstimate).toBe(false);
  });

  it("treats a week's end boundary as inside that week", () => {
    const resolved = resolveAt("2024-07-15T03:59:59Z");

    expect(resolved.currentWeek.week).toBe(2);
    expect(resolved.matchedBy).toBe(WEEK_MATCH.CONTAINING);
    expect(resolved.isEstimate).toBe(false);
  });

  it("moves to the next week one second past a week's end", () => {
    expect(resolveAt("2024-07-15T04:00:00Z").currentWeek.week).toBe(3);
  });
});

describe("useCurrentWeek — answered but unusable payload", () => {
  it("falls back to the estimate when an in-season answer carries no week", () => {
    useGetCurrentNflWeek.mockReturnValue(
      nflQueryState({
        currentWeekInfo: {
          is_off_season: false,
          season_year: 2024,
          season_type_value: 2,
          week_value: null,
        },
      }),
    );

    const { result } = renderHook(() =>
      useCurrentWeek("NFL", { now: IN_SEASON_NOW }),
    );
    const fallback = getDefaultNFLSelection(new Date(IN_SEASON_NOW));

    expect(result.current.isEstimate).toBe(true);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.isOffSeason).toBe(false);
    expect(result.current.isError).toBe(false);
    expect(result.current.currentWeek).toEqual({
      week: fallback.week,
      seasonType: fallback.seasonType,
      year: fallback.year,
    });
  });

  it("falls back when the payload is empty and nothing is in flight", () => {
    useGetCurrentNflWeek.mockReturnValue(
      nflQueryState({ currentWeekInfo: {}, status: "success" }),
    );

    const { result } = renderHook(() =>
      useCurrentWeek("NFL", { now: IN_SEASON_NOW }),
    );

    expect(result.current.isLoading).toBe(false);
    expect(result.current.isEstimate).toBe(true);
    expect(result.current.currentWeek.week).toBe(
      getDefaultNFLSelection(new Date(IN_SEASON_NOW)).week,
    );
  });

  it("does not report loading for a disabled query sitting at status loading", () => {
    useGetCurrentNflWeek.mockReturnValue(
      nflQueryState({ status: "loading", isFetching: false }),
    );

    const { result } = renderHook(() =>
      useCurrentWeek("NFL", { now: IN_SEASON_NOW }),
    );

    expect(result.current.isLoading).toBe(false);
    expect(result.current.isEstimate).toBe(true);
  });
});

describe("useCurrentWeek — sport argument handling", () => {
  it.each(["mlb", "  MLB  ", "Mlb"])("treats %p as MLB", (sport) => {
    const { result } = renderHook(() =>
      useCurrentWeek(sport, {
        mlbWeeksData: suppliedRange,
        now: Date.parse("2024-07-10T18:00:00Z"),
      }),
    );

    expect(result.current.currentWeek).toEqual({
      week: 2,
      seasonType: MLB_SEASON_TYPE,
      year: 2024,
    });
    expect(useGetCurrentNflWeek).toHaveBeenCalledWith(false);
  });

  it.each([[null], [undefined], ["NFL"], ["nfl"], ["NBA"], [2]])(
    "treats %p as NFL",
    (sport) => {
      useGetCurrentNflWeek.mockReturnValue(
        nflQueryState({
          currentWeekInfo: authoritativeWeek({ week_value: 9 }),
        }),
      );

      const { result } = renderHook(() => useCurrentWeek(sport));

      expect(useGetCurrentNflWeek).toHaveBeenCalledWith(true);
      expect(result.current.currentWeek.week).toBe(9);
    },
  );
});

describe("useCurrentWeek — stability across re-renders", () => {
  it("returns the same result for an NFL room when nothing changes", () => {
    useGetCurrentNflWeek.mockReturnValue(
      nflQueryState({ currentWeekInfo: authoritativeWeek() }),
    );

    const { result, rerender } = renderHook(() =>
      useCurrentWeek("NFL", { now: IN_SEASON_NOW }),
    );
    const first = result.current;

    rerender();
    rerender();

    expect(result.current).toBe(first);
  });

  it("returns the same result for an MLB room when nothing changes", () => {
    const { result, rerender } = renderHook(() =>
      useCurrentWeek("MLB", {
        mlbWeeksData: suppliedRange,
        now: Date.parse("2024-07-10T18:00:00Z"),
      }),
    );
    const first = result.current;

    rerender();
    rerender();

    expect(result.current).toBe(first);
  });
});

describe("useCurrentWeek — matchedBy and isError", () => {
  it("reports an authoritative match for a usable NFL answer", () => {
    useGetCurrentNflWeek.mockReturnValue(
      nflQueryState({ currentWeekInfo: authoritativeWeek() }),
    );

    const { result } = renderHook(() => useCurrentWeek("NFL"));

    expect(result.current.matchedBy).toBe(WEEK_MATCH.AUTHORITATIVE);
    expect(result.current.isError).toBe(false);
  });

  it("reports no match when the NFL estimate is used", () => {
    useGetCurrentNflWeek.mockReturnValue(
      nflQueryState({ status: "error", isError: true }),
    );

    const { result } = renderHook(() =>
      useCurrentWeek("NFL", { now: IN_SEASON_NOW }),
    );

    expect(result.current.matchedBy).toBe(WEEK_MATCH.NONE);
    expect(result.current.isError).toBe(true);
  });

  it("reports an upcoming match when the range starts after now", () => {
    const { result } = renderHook(() =>
      useCurrentWeek("MLB", {
        mlbWeeksData: suppliedRange,
        now: Date.parse("2024-06-01T18:00:00Z"),
      }),
    );

    expect(result.current.matchedBy).toBe(WEEK_MATCH.UPCOMING);
    expect(result.current.currentWeek.week).toBe(1);
    expect(result.current.isEstimate).toBe(true);
  });

  it("reports a past match when the range ended before now", () => {
    const { result } = renderHook(() =>
      useCurrentWeek("MLB", {
        mlbWeeksData: suppliedRange,
        now: Date.parse("2024-09-01T18:00:00Z"),
      }),
    );

    expect(result.current.matchedBy).toBe(WEEK_MATCH.PAST);
    expect(result.current.currentWeek.week).toBe(3);
    expect(result.current.isEstimate).toBe(true);
  });

  it("surfaces a range error while still resolving from cached weeks", () => {
    const { result } = renderHook(() =>
      useCurrentWeek("MLB", {
        mlbWeeksData: mlbRangeState({
          availableWeeks: RANGE_WEEKS,
          isMLBWeeksError: true,
        }),
        now: Date.parse("2024-07-10T18:00:00Z"),
      }),
    );

    expect(result.current.isError).toBe(true);
    expect(result.current.currentWeek.week).toBe(2);
  });

  it("surfaces a range error when no weeks came back at all", () => {
    useGetMLBWeeksInRange.mockReturnValue(
      mlbRangeState({ isMLBWeeksError: true }),
    );

    const { result } = renderHook(() =>
      useCurrentWeek("MLB", {
        room: { start_date: 1719800000, end_date: 1721600000 },
      }),
    );

    expect(result.current.isError).toBe(true);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.currentWeek).toBeNull();
  });
});
