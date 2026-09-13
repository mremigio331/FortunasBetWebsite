/**
 * Property-based coverage for NFL deliberate-selection preservation.
 *
 * Feature: current-week-selection-fix, Property 2: For any Deliberate_Selection
 * and any subsequent sequence of Authoritative_Week_Source resolutions,
 * refetches, and window-focus events, the Week_Selection_State SHALL remain
 * equal to the Deliberate_Selection.
 *
 * `useGetCurrentNflWeek` runs with `refetchOnWindowFocus: true`, so a user who
 * tabs away and comes back gets a fresh Current_Week payload and a fresh range
 * array handed to this hook — repeatedly, and at arbitrary moments. None of it
 * may move a selection the user made themselves (Requirements 2.1, 2.2, 2.3,
 * 8.5).
 *
 * Scope note: the hook *does* correct its own state when the user's year or
 * season-type change invalidates the week, so the control never renders blank.
 * That is intended, and it is not what this property is about. The generators
 * therefore only ever produce a Deliberate_Selection that is a valid in-range
 * combination, and every generated event is a resolution/refetch/focus event
 * that leaves the combination valid — so any movement in the selection is a
 * genuine violation rather than an intended self-correction.
 *
 * **Validates: Requirements 2.1, 2.2, 2.3, 8.5**
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
const buildSeason = (year, preseasonWeeks, regularWeeks) => {
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
 * A Room_Week_Range spanning one or two Season_Years, so a deliberate year
 * change has somewhere real to go.
 */
const buildRange = ({ year, seasons }) =>
  seasons.flatMap((season, index) =>
    buildSeason(year + index, season.preseasonWeeks, season.regularWeeks),
  );

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

const identityOf = (entry) => ({
  week: entry.week,
  seasonType: entry.season_type,
  year: entry.year,
});

const sameSelection = (a, b) =>
  Boolean(a) &&
  Boolean(b) &&
  a.week === b.week &&
  a.seasonType === b.seasonType &&
  a.year === b.year;

/**
 * One thing that can happen *after* the Deliberate_Selection. Every kind models
 * something the page genuinely does: a Current_Week resolving (or re-resolving
 * with a different, string-typed, or missing payload), a refetch handing back
 * fresh array/object identities, the in-flight gap in the middle of a refetch,
 * the clock moving on, a window-focus refetch, or the status flags flipping.
 */
const eventArb = fc.record({
  kind: fc.constantFrom(
    "resolveInRange",
    "resolveAsStrings",
    "resolveOutOfRange",
    "resolveAbsent",
    "refetchFreshIdentity",
    "refetchInFlight",
    "advanceNow",
    "windowFocusRefetch",
    "flagFlip",
  ),
  weekIndex: fc.nat({ max: 60 }),
  absentWeek: fc.integer(ABSENT_WEEK),
  nowDeltaWeeks: fc.integer({ min: -40, max: 40 }),
  flags: fc.record({
    isCurrentWeekLoading: fc.boolean(),
    isCurrentWeekEstimate: fc.boolean(),
    isOffSeason: fc.boolean(),
  }),
});

const scenarioArb = fc.record({
  year: fc.integer({ min: 2020, max: 2030 }),
  seasons: fc.array(
    fc.record({
      preseasonWeeks: fc.integer({ min: 0, max: 4 }),
      regularWeeks: fc.integer({ min: 1, max: 18 }),
    }),
    { minLength: 1, maxLength: 2 },
  ),
  // Which week contains the present moment before any event fires, and where
  // inside it "now" falls.
  nowWeekIndex: fc.nat({ max: 60 }),
  nowOffsetSeconds: fc.integer({ min: 0, max: WEEK_SECONDS - 1 }),
  // The week the Authoritative_Week_Source reports at first render.
  initialCurrentWeekIndex: fc.nat({ max: 60 }),
  // How the user makes their choice: the week dropdown alone, or year and
  // season-type first (which is where the hook's own corrections live).
  deliberateVia: fc.constantFrom("weekOnly", "yearSeasonTypeAndWeek"),
  // Antd hands back whatever the option carried; ESPN-sourced options can be
  // strings, and a Deliberate_Selection must normalize the same way.
  deliberateAsStrings: fc.boolean(),
  deliberateIndex: fc.nat({ max: 60 }),
  events: fc.array(eventArb, { minLength: 1, maxLength: 6 }),
});

describe("useNFLWeekSelection — Property 2: deliberate selection is preserved", () => {
  it("holds the user's selection across arbitrary resolutions, refetches, and focus events", () => {
    // Coverage witnesses, checked after the run. Without them the property could
    // pass while never once making the resolution disagree with the user.
    const seen = {
      resolutionDisagreed: 0,
      refetched: 0,
      windowFocused: 0,
      weekOnly: 0,
      yearSeasonTypeAndWeek: 0,
    };

    fc.assert(
      fc.property(scenarioArb, (scenario) => {
        const weeks = buildRange(scenario);
        const pick = (index) => weeks[index % weeks.length];

        const nowWeek = pick(scenario.nowWeekIndex);
        const baseNow =
          (nowWeek.week_start_epoch + scenario.nowOffsetSeconds) * SECOND_MS;

        const room = {
          start_date: weeks[0].week_start_epoch,
          end_date: weeks[weeks.length - 1].week_end_epoch,
        };

        let props = {
          room,
          nflWeeksData: rangeState({ nflWeeks: weeks }),
          currentWeek: identityOf(pick(scenario.initialCurrentWeekIndex)),
          isCurrentWeekLoading: false,
          isCurrentWeekEstimate: false,
          isOffSeason: false,
          now: baseNow,
        };

        const { result, rerender, unmount } = renderHook(
          (nextProps) => useNFLWeekSelection(nextProps),
          { initialProps: props },
        );

        try {
          // The page has adopted the resolved default; nothing deliberate yet.
          expect(result.current.hasUserSelected).toBe(false);

          const clearBets = jest.fn();
          const handlers = () => result.current.createChangeHandlers(clearBets);
          const asGiven = (value) =>
            scenario.deliberateAsStrings ? String(value) : value;

          // -------------------------------------------------------------------
          // The Deliberate_Selection. Always a valid in-range combination, so
          // the hook's own coherence corrections have nothing to correct.
          // -------------------------------------------------------------------
          let deliberate;
          if (scenario.deliberateVia === "weekOnly") {
            const options = result.current.weekOptions;
            expect(options.length).toBeGreaterThan(0);
            deliberate = {
              week: options[scenario.deliberateIndex % options.length],
              seasonType: result.current.selectedSeasonType,
              year: result.current.selectedYear,
            };
            act(() => {
              handlers().handleWeekChange(asGiven(deliberate.week));
            });
            seen.weekOnly += 1;
          } else {
            deliberate = identityOf(pick(scenario.deliberateIndex));
            // Year, then season type, then week: each narrows the options the
            // next one is chosen from, which is the order the UI enforces.
            act(() => {
              handlers().handleYearChange(asGiven(deliberate.year));
            });
            act(() => {
              handlers().handleSeasonTypeChange(asGiven(deliberate.seasonType));
            });
            act(() => {
              handlers().handleWeekChange(asGiven(deliberate.week));
            });
            seen.yearSeasonTypeAndWeek += 1;
          }

          expect(result.current.hasUserSelected).toBe(true);
          expect(selectionOf(result)).toEqual(deliberate);

          // -------------------------------------------------------------------
          // Everything that happens next must leave it alone.
          // -------------------------------------------------------------------
          scenario.events.forEach((event) => {
            const freshRange = () => rangeState({ nflWeeks: [...weeks] });

            switch (event.kind) {
              case "resolveInRange":
                props = {
                  ...props,
                  currentWeek: identityOf(pick(event.weekIndex)),
                };
                break;
              case "resolveAsStrings": {
                const reported = pick(event.weekIndex);
                props = {
                  ...props,
                  currentWeek: {
                    week: String(reported.week),
                    seasonType: String(reported.season_type),
                    year: String(reported.year),
                  },
                };
                break;
              }
              case "resolveOutOfRange":
                props = {
                  ...props,
                  currentWeek: {
                    week: event.absentWeek,
                    seasonType: 2,
                    year: scenario.year,
                  },
                };
                break;
              case "resolveAbsent":
                props = { ...props, currentWeek: null };
                break;
              case "refetchFreshIdentity":
                // Same data, new array and new payload object: the identity
                // churn a successful refetch produces.
                props = {
                  ...props,
                  nflWeeksData: freshRange(),
                  currentWeek: props.currentWeek
                    ? { ...props.currentWeek }
                    : null,
                };
                seen.refetched += 1;
                break;
              case "refetchInFlight":
                // The gap mid-refetch: the range momentarily has no weeks and
                // the Current_Week reports loading. Then it comes back.
                rerender({
                  ...props,
                  nflWeeksData: rangeState({
                    nflWeeks: [],
                    isNFLWeeksFetching: true,
                  }),
                  isCurrentWeekLoading: true,
                });
                expect(selectionOf(result)).toEqual(deliberate);
                props = {
                  ...props,
                  nflWeeksData: freshRange(),
                  isCurrentWeekLoading: false,
                };
                seen.refetched += 1;
                break;
              case "advanceNow":
                props = {
                  ...props,
                  now: baseNow + event.nowDeltaWeeks * WEEK_MS,
                };
                break;
              case "windowFocusRefetch":
                // `refetchOnWindowFocus: true` (Requirement 2.3): the focus
                // event itself, followed by the refetched payload.
                act(() => {
                  window.dispatchEvent(new Event("focus"));
                });
                expect(selectionOf(result)).toEqual(deliberate);
                props = {
                  ...props,
                  nflWeeksData: freshRange(),
                  currentWeek: identityOf(pick(event.weekIndex)),
                };
                seen.windowFocused += 1;
                break;
              case "flagFlip":
                props = { ...props, ...event.flags };
                break;
              default:
                throw new Error(`unhandled event kind: ${event.kind}`);
            }

            rerender(props);

            if (!sameSelection(result.current.resolvedSelection, deliberate)) {
              // The resolution now points somewhere else — the interesting case.
              seen.resolutionDisagreed += 1;
            }

            expect(selectionOf(result)).toEqual(deliberate);
            expect(result.current.hasUserSelected).toBe(true);
          });
        } finally {
          unmount();
        }
      }),
      { numRuns: 150 },
    );

    expect(seen.resolutionDisagreed).toBeGreaterThan(0);
    expect(seen.refetched).toBeGreaterThan(0);
    expect(seen.windowFocused).toBeGreaterThan(0);
    expect(seen.weekOnly).toBeGreaterThan(0);
    expect(seen.yearSeasonTypeAndWeek).toBeGreaterThan(0);
  });
});

describe("useNFLWeekSelection — window-focus refetch", () => {
  it("survives repeated window-focus refetches that report a different current week", () => {
    // `useGetCurrentNflWeek` sets `refetchOnWindowFocus: true`, so tabbing back
    // into the page re-resolves the Current_Week. A user who is mid-task on an
    // earlier week must not be yanked forward (Requirement 2.3).
    const weeks = buildSeason(2024, 2, 4);
    const room = {
      start_date: weeks[0].week_start_epoch,
      end_date: weeks[weeks.length - 1].week_end_epoch,
    };
    const regularWeek2 = weeks.find(
      (entry) => entry.season_type === 2 && entry.week === 2,
    );
    const now = (regularWeek2.week_start_epoch + 3600) * SECOND_MS;

    const { result, rerender } = renderHook(
      (props) => useNFLWeekSelection(props),
      {
        initialProps: {
          room,
          nflWeeksData: rangeState({ nflWeeks: weeks }),
          currentWeek: { week: 2, seasonType: 2, year: 2024 },
          now,
        },
      },
    );

    expect(result.current.selectedWeek).toBe(2);

    act(() => {
      result.current.createChangeHandlers(jest.fn()).handleWeekChange(4);
    });
    expect(result.current.selectedWeek).toBe(4);

    // Three focus cycles. Each one: the focus event, the loading flag flipping
    // while the refetch is in flight, then a fresh payload — twice reporting a
    // different week, once as ESPN's strings.
    const refetches = [
      { week: 3, seasonType: 2, year: 2024 },
      { week: "1", seasonType: "1", year: "2024" },
      { week: 3, seasonType: 2, year: 2024 },
    ];

    refetches.forEach((currentWeek) => {
      act(() => {
        window.dispatchEvent(new Event("focus"));
      });
      expect(result.current.selectedWeek).toBe(4);

      rerender({
        room,
        nflWeeksData: rangeState({ nflWeeks: [...weeks] }),
        currentWeek,
        isCurrentWeekLoading: true,
        now,
      });
      expect(result.current.selectedWeek).toBe(4);

      rerender({
        room,
        nflWeeksData: rangeState({ nflWeeks: [...weeks] }),
        currentWeek,
        isCurrentWeekLoading: false,
        now,
      });

      expect(result.current.selectedWeek).toBe(4);
      expect(result.current.selectedSeasonType).toBe(2);
      expect(result.current.selectedYear).toBe(2024);
      expect(result.current.hasUserSelected).toBe(true);
    });
  });
});
