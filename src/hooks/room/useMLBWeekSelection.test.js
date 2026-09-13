/**
 * `useMLBWeekSelection` — regression coverage for the Week-1 pinning bug.
 *
 * The three behaviors pinned here are the ones the old implementation got wrong:
 * adopting a late-resolving default even though the state already held a value,
 * never clobbering a Deliberate_Selection, and deriving the odds-query date in
 * Eastern Time rather than the viewer's zone.
 *
 * Task 7.6 extends this with the fuller MLB containing-week adoption suite:
 * boundary instants, the upcoming/past ordering fallbacks, the anti-Week-1
 * assertion across a long range, and the durability of a Deliberate_Selection
 * across a long sequence of resolutions.
 *
 * _Requirements: 1.2, 1.3, 2.1, 2.2, 3.3, 4.2, 4.3, 4.4, 8.5, 8.6_
 */

import { renderHook, act } from "@testing-library/react";
import useMLBWeekSelection from "./useMLBWeekSelection";
import { WEEK_MATCH } from "../../utils/weekResolution";

jest.mock("antd", () => ({
  __esModule: true,
  message: { info: jest.fn(), success: jest.fn(), error: jest.fn() },
}));

const epochSeconds = (iso) => Math.floor(Date.parse(iso) / 1000);

/** Mon 00:00:00 ET - Sun 23:59:59 ET weeks, the shape the range endpoint returns. */
const week = (number, startIso, endIso) => ({
  week: number,
  start: epochSeconds(startIso),
  end: epochSeconds(endIso),
  label: `Week ${number}`,
});

const WEEKS = [
  week(1, "2024-07-01T04:00:00Z", "2024-07-08T03:59:59Z"),
  week(2, "2024-07-08T04:00:00Z", "2024-07-15T03:59:59Z"),
  week(3, "2024-07-15T04:00:00Z", "2024-07-22T03:59:59Z"),
];

/** Stand-in for the `useGetMLBWeeksInRange` return value. */
const rangeState = (overrides = {}) => {
  const availableWeeks = overrides.availableWeeks ?? [];
  return {
    isMLBWeeksFetching: false,
    isMLBWeeksError: false,
    getWeekByNumber: (number) =>
      availableWeeks.find((entry) => entry.week === number) || null,
    ...overrides,
    availableWeeks,
  };
};

const ROOM = { start_date: WEEKS[0].start, end_date: WEEKS[2].end };

// Mid Week 2 and mid Week 3, expressed as absolute instants.
const DURING_WEEK_TWO = Date.parse("2024-07-10T18:00:00Z");
const DURING_WEEK_THREE = Date.parse("2024-07-17T18:00:00Z");

const WEEK_SECONDS = 7 * 24 * 60 * 60;

/**
 * A 12-week range, long enough that landing on Week 1 by accident is
 * distinguishable from landing on it because it genuinely contains `now`.
 * July - September 2024 is entirely EDT, so a flat 7-day stride keeps every
 * boundary on Mon 00:00:00 / Sun 23:59:59 ET.
 */
const LONG_RANGE = Array.from({ length: 12 }, (_, index) => {
  const start = epochSeconds("2024-07-01T04:00:00Z") + index * WEEK_SECONDS;
  return {
    week: index + 1,
    start,
    end: start + WEEK_SECONDS - 1,
    label: `Week ${index + 1}`,
  };
});

const LONG_ROOM = {
  start_date: LONG_RANGE[0].start,
  end_date: LONG_RANGE[LONG_RANGE.length - 1].end,
};

/** An instant safely inside the given week entry, in epoch millis. */
const midweekMillis = (entry) =>
  Math.floor((entry.start + entry.end) / 2) * 1000;

describe("useMLBWeekSelection — adopt-on-resolve", () => {
  it("selects the containing week rather than week 1", () => {
    const { result } = renderHook(() =>
      useMLBWeekSelection({
        room: ROOM,
        mlbWeeksData: rangeState({ availableWeeks: WEEKS }),
        now: DURING_WEEK_TWO,
      }),
    );

    expect(result.current.selectedWeekNumber).toBe(2);
    expect(result.current.hasUserSelected).toBe(false);
  });

  it("adopts the resolved week when the range arrives after the first render", () => {
    const { result, rerender } = renderHook(
      (props) => useMLBWeekSelection(props),
      {
        initialProps: {
          room: ROOM,
          mlbWeeksData: rangeState({ isMLBWeeksFetching: true }),
          now: DURING_WEEK_TWO,
        },
      },
    );

    // Nothing to show yet, and the hook says so instead of guessing.
    expect(result.current.selectedWeekNumber).toBeNull();
    expect(result.current.isWeekLoading).toBe(true);

    rerender({
      room: ROOM,
      mlbWeeksData: rangeState({ availableWeeks: WEEKS }),
      now: DURING_WEEK_TWO,
    });

    expect(result.current.selectedWeekNumber).toBe(2);
    expect(result.current.isWeekLoading).toBe(false);
  });

  it("adopts a later resolution even though the state already holds a week", () => {
    // The exact shape of the old bug: state is already truthy (week 1) when the
    // containing-week default resolves. Adoption must still happen.
    const { result, rerender } = renderHook(
      (props) => useMLBWeekSelection(props),
      {
        initialProps: {
          room: ROOM,
          mlbWeeksData: rangeState({ availableWeeks: [WEEKS[0]] }),
          now: DURING_WEEK_TWO,
        },
      },
    );

    expect(result.current.selectedWeekNumber).toBe(1);

    rerender({
      room: ROOM,
      mlbWeeksData: rangeState({ availableWeeks: WEEKS }),
      now: DURING_WEEK_TWO,
    });

    expect(result.current.selectedWeekNumber).toBe(2);
  });

  it("prefers the Current_Week reported by useCurrentWeek", () => {
    const { result } = renderHook(() =>
      useMLBWeekSelection({
        room: ROOM,
        mlbWeeksData: rangeState({ availableWeeks: WEEKS }),
        currentWeek: { week: 3, seasonType: 2, year: 2024 },
        now: DURING_WEEK_TWO,
      }),
    );

    expect(result.current.selectedWeekNumber).toBe(3);
  });

  it("flags an estimate when the room range does not cover the present moment", () => {
    const { result } = renderHook(() =>
      useMLBWeekSelection({
        room: ROOM,
        mlbWeeksData: rangeState({ availableWeeks: WEEKS }),
        now: Date.parse("2024-06-01T18:00:00Z"),
      }),
    );

    // Nearest upcoming week, and the page is told this is not the current week.
    expect(result.current.selectedWeekNumber).toBe(1);
    expect(result.current.isCurrentWeekOutOfRange).toBe(true);
    expect(result.current.isWeekEstimate).toBe(true);
  });
});

describe("useMLBWeekSelection — deliberate selection", () => {
  it("survives a subsequent resolution and clears pending bets", () => {
    const clearBets = jest.fn();
    const { result, rerender } = renderHook(
      (props) => useMLBWeekSelection(props),
      {
        initialProps: {
          room: ROOM,
          mlbWeeksData: rangeState({ availableWeeks: WEEKS }),
          now: DURING_WEEK_TWO,
        },
      },
    );

    expect(result.current.selectedWeekNumber).toBe(2);

    act(() => {
      result.current.createChangeHandlers(clearBets).handleWeekChange(3);
    });

    expect(result.current.selectedWeekNumber).toBe(3);
    expect(result.current.hasUserSelected).toBe(true);
    expect(clearBets).toHaveBeenCalledTimes(1);

    // A refetch hands back an equivalent range with a fresh identity, and the
    // resolver still says week 2 is current. The user's choice must hold.
    rerender({
      room: ROOM,
      mlbWeeksData: rangeState({ availableWeeks: [...WEEKS] }),
      now: DURING_WEEK_TWO,
    });

    expect(result.current.selectedWeekNumber).toBe(3);
    expect(result.current.resolvedWeekNumber).toBe(2);
  });
});

describe("useMLBWeekSelection — Eastern Time formatting", () => {
  it("formats selectedDate as the ET calendar date of the week start", () => {
    const { result } = renderHook(() =>
      useMLBWeekSelection({
        room: ROOM,
        mlbWeeksData: rangeState({ availableWeeks: WEEKS }),
        now: DURING_WEEK_TWO,
      }),
    );

    // Week 2 starts 2024-07-08T04:00:00Z === Mon Jul 8 00:00 ET. A viewer in a
    // zone west of ET would see Jul 7 from browser-local accessors.
    expect(result.current.selectedDate).toBe("20240708");
  });

  it("labels week options with ET date ranges", () => {
    const { result } = renderHook(() =>
      useMLBWeekSelection({
        room: ROOM,
        mlbWeeksData: rangeState({ availableWeeks: WEEKS }),
        now: DURING_WEEK_TWO,
      }),
    );

    expect(result.current.weekOptions).toEqual([
      { value: 1, label: "Week 1 (Jul 1 - Jul 7)" },
      { value: 2, label: "Week 2 (Jul 8 - Jul 14)" },
      { value: 3, label: "Week 3 (Jul 15 - Jul 21)" },
    ]);
  });
});
describe("useMLBWeekSelection — week boundary instants", () => {
  const selectionAt = (nowMillis, weeks = WEEKS) =>
    renderHook(() =>
      useMLBWeekSelection({
        room: ROOM,
        mlbWeeksData: rangeState({ availableWeeks: weeks }),
        now: nowMillis,
      }),
    ).result;

  it("adopts the week whose start is exactly the present moment", () => {
    // Boundaries are inclusive on both ends, so Mon 00:00:00 ET belongs to the
    // week that begins, not the one that just closed.
    const result = selectionAt(WEEKS[1].start * 1000);

    expect(result.current.selectedWeekNumber).toBe(2);
    expect(result.current.matchedBy).toBe(WEEK_MATCH.CONTAINING);
    expect(result.current.isCurrentWeekOutOfRange).toBe(false);
  });

  it("adopts the week whose end is exactly the present moment", () => {
    const result = selectionAt(WEEKS[1].end * 1000);

    expect(result.current.selectedWeekNumber).toBe(2);
    expect(result.current.matchedBy).toBe(WEEK_MATCH.CONTAINING);
  });

  it("moves to the next week one second past a week's end", () => {
    const result = selectionAt((WEEKS[1].end + 1) * 1000);

    expect(result.current.selectedWeekNumber).toBe(3);
    expect(result.current.matchedBy).toBe(WEEK_MATCH.CONTAINING);
  });
});

describe("useMLBWeekSelection — resolution ordering fallbacks", () => {
  it("falls back to the most recent past week once the range is behind us", () => {
    const { result } = renderHook(() =>
      useMLBWeekSelection({
        room: ROOM,
        mlbWeeksData: rangeState({ availableWeeks: WEEKS }),
        // A day after the range closes: nothing contains now, nothing upcoming.
        now: (WEEKS[2].end + 24 * 60 * 60) * 1000,
      }),
    );

    expect(result.current.selectedWeekNumber).toBe(3);
    expect(result.current.matchedBy).toBe(WEEK_MATCH.PAST);
    expect(result.current.isCurrentWeekOutOfRange).toBe(true);
    expect(result.current.isWeekEstimate).toBe(true);
  });

  it("falls back to the nearest upcoming week when now lands in a gap", () => {
    // Week 2 is missing from the range; the present moment sits in the hole.
    const gapped = [WEEKS[0], WEEKS[2]];
    const { result } = renderHook(() =>
      useMLBWeekSelection({
        room: ROOM,
        mlbWeeksData: rangeState({ availableWeeks: gapped }),
        now: DURING_WEEK_TWO,
      }),
    );

    expect(result.current.selectedWeekNumber).toBe(3);
    expect(result.current.matchedBy).toBe(WEEK_MATCH.UPCOMING);
    expect(result.current.isCurrentWeekOutOfRange).toBe(true);
  });
});

describe("useMLBWeekSelection — containing week across a long range", () => {
  it("adopts the containing week for every week of a 12-week range", () => {
    // The strongest form of the anti-Week-1 assertion: Week 1 is only ever the
    // answer when Week 1 actually contains the present moment.
    LONG_RANGE.forEach((entry) => {
      const { result, unmount } = renderHook(() =>
        useMLBWeekSelection({
          room: LONG_ROOM,
          mlbWeeksData: rangeState({ availableWeeks: LONG_RANGE }),
          now: midweekMillis(entry),
        }),
      );

      expect(result.current.selectedWeekNumber).toBe(entry.week);
      expect(result.current.matchedBy).toBe(WEEK_MATCH.CONTAINING);
      expect(result.current.isCurrentWeekOutOfRange).toBe(false);
      if (entry.week !== 1) {
        expect(result.current.selectedWeekNumber).not.toBe(1);
      }

      unmount();
    });
  });
});

describe("useMLBWeekSelection — deliberate selection durability", () => {
  it("holds through a long sequence of differing resolutions", () => {
    const clearBets = jest.fn();
    const { result, rerender } = renderHook(
      (props) => useMLBWeekSelection(props),
      {
        initialProps: {
          room: LONG_ROOM,
          mlbWeeksData: rangeState({ availableWeeks: LONG_RANGE }),
          now: midweekMillis(LONG_RANGE[1]),
        },
      },
    );

    expect(result.current.selectedWeekNumber).toBe(2);

    act(() => {
      result.current.createChangeHandlers(clearBets).handleWeekChange(9);
    });

    expect(result.current.selectedWeekNumber).toBe(9);
    expect(result.current.hasUserSelected).toBe(true);

    // Fresh range identities, a moving present moment, a status-flag flip, an
    // authoritative week that disagrees, and a shortened range. None of it may
    // move the user off Week 9 — but `resolvedWeekNumber` keeps reporting what
    // the resolver would have chosen, so the page can still offer to jump.
    const later = [
      {
        mlbWeeksData: rangeState({ availableWeeks: [...LONG_RANGE] }),
        now: midweekMillis(LONG_RANGE[4]),
        expectedResolved: 5,
      },
      {
        mlbWeeksData: rangeState({
          availableWeeks: [...LONG_RANGE],
          isMLBWeeksFetching: true,
        }),
        now: midweekMillis(LONG_RANGE[6]),
        expectedResolved: 7,
      },
      {
        mlbWeeksData: rangeState({ availableWeeks: [...LONG_RANGE] }),
        now: midweekMillis(LONG_RANGE[10]),
        currentWeek: { week: 3, seasonType: 2, year: 2024 },
        expectedResolved: 3,
      },
      {
        mlbWeeksData: rangeState({ availableWeeks: LONG_RANGE.slice(0, 4) }),
        now: midweekMillis(LONG_RANGE[1]),
        expectedResolved: 2,
      },
    ];

    later.forEach(({ expectedResolved, ...props }) => {
      rerender({ room: LONG_ROOM, ...props });

      expect(result.current.selectedWeekNumber).toBe(9);
      expect(result.current.hasUserSelected).toBe(true);
      expect(result.current.resolvedWeekNumber).toBe(expectedResolved);
    });

    // One user action, one bet clear.
    expect(clearBets).toHaveBeenCalledTimes(1);
  });

  it("pins a deliberate selection that happens to match the resolved week", () => {
    const clearBets = jest.fn();
    const { result, rerender } = renderHook(
      (props) => useMLBWeekSelection(props),
      {
        initialProps: {
          room: ROOM,
          mlbWeeksData: rangeState({ availableWeeks: WEEKS }),
          now: DURING_WEEK_TWO,
        },
      },
    );

    expect(result.current.selectedWeekNumber).toBe(2);
    expect(result.current.hasUserSelected).toBe(false);

    // Choosing the week that is already showing is still a choice.
    act(() => {
      result.current.createChangeHandlers(clearBets).handleWeekChange(2);
    });

    expect(result.current.hasUserSelected).toBe(true);
    expect(clearBets).toHaveBeenCalledTimes(1);

    // Time rolls into Week 3. Without the flag, adoption would move the user.
    rerender({
      room: ROOM,
      mlbWeeksData: rangeState({ availableWeeks: WEEKS }),
      now: DURING_WEEK_THREE,
    });

    expect(result.current.selectedWeekNumber).toBe(2);
    expect(result.current.resolvedWeekNumber).toBe(3);
  });
});

describe("useMLBWeekSelection — selected week entry", () => {
  it("tracks the adopted week entry and its ET date across a deliberate change", () => {
    const { result } = renderHook(() =>
      useMLBWeekSelection({
        room: ROOM,
        mlbWeeksData: rangeState({ availableWeeks: WEEKS }),
        now: DURING_WEEK_TWO,
      }),
    );

    expect(result.current.selectedWeek).toBe(WEEKS[1]);
    expect(result.current.selectedDate).toBe("20240708");

    act(() => {
      result.current.createChangeHandlers(jest.fn()).handleWeekChange(3);
    });

    expect(result.current.selectedWeek).toBe(WEEKS[2]);
    expect(result.current.selectedDate).toBe("20240715");
  });

  it("falls back to getWeekByNumber when availableWeeks lacks the entry", () => {
    const orphan = week(9, "2024-08-26T04:00:00Z", "2024-09-02T03:59:59Z");
    const getWeekByNumber = jest.fn((number) => (number === 9 ? orphan : null));

    const { result } = renderHook(() =>
      useMLBWeekSelection({
        room: ROOM,
        mlbWeeksData: rangeState({
          availableWeeks: WEEKS,
          getWeekByNumber,
        }),
        now: DURING_WEEK_TWO,
      }),
    );

    act(() => {
      result.current.createChangeHandlers(jest.fn()).handleWeekChange(9);
    });

    expect(result.current.selectedWeek).toBe(orphan);
    expect(result.current.selectedDate).toBe("20240826");
    expect(getWeekByNumber).toHaveBeenCalledWith(9);
  });
});

describe("useMLBWeekSelection — empty range", () => {
  it("makes no selection when a dated room resolves to an empty range", () => {
    const { result } = renderHook(() =>
      useMLBWeekSelection({
        room: ROOM,
        mlbWeeksData: rangeState({ availableWeeks: [] }),
        now: DURING_WEEK_TWO,
      }),
    );

    expect(result.current.selectedWeekNumber).toBeNull();
    expect(result.current.selectedWeek).toBeNull();
    expect(result.current.selectedDate).toBeNull();
    expect(result.current.weekOptions).toEqual([]);
    expect(result.current.matchedBy).toBe(WEEK_MATCH.NONE);
    // A dated room with no weeks yet is still waiting on something.
    expect(result.current.isWeekLoading).toBe(true);
  });

  it("does not sit in a loading state for a room without dates", () => {
    const { result } = renderHook(() =>
      useMLBWeekSelection({
        room: null,
        mlbWeeksData: rangeState({ availableWeeks: [] }),
        now: DURING_WEEK_TWO,
      }),
    );

    expect(result.current.selectedWeekNumber).toBeNull();
    expect(result.current.isWeekLoading).toBe(false);
  });
});
