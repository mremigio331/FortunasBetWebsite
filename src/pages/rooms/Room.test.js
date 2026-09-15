/**
 * `Room.js` — integration coverage for the Current_Week wiring.
 *
 * This suite renders the actual page and drives it through the actual
 * `useCurrentWeek` -> `useNFLWeekSelection` / `useMLBWeekSelection` ->
 * `WeekYearSelector` / `MLBWeekSelector` / `WeekResolutionNotice` chain. Only the
 * *leaf* data hooks are mocked, because the wiring between those pieces is
 * exactly what is under test: mocking the selection hooks would assert nothing
 * about it.
 *
 * The leaf hooks read from a small external store so a value can resolve *after*
 * the initial render, which is the shape of the original defaulting bug: the
 * authoritative week arrived late and every path that would have applied it was
 * gated on the state being empty (Requirement 8.1).
 *
 * The clock is fixed with fake timers rather than left to the machine, so week
 * boundary comparisons are deterministic under any `TZ`.
 *
 * _Requirements: 1.1, 1.4, 1.5, 1.6, 8.1, 8.5_
 */

import React, { useSyncExternalStore } from "react";
import {
  render,
  screen,
  waitFor,
  act,
  fireEvent,
} from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { message } from "antd";

import Room from "./Room";
import { UserAuthenticationContext } from "../../provider/UserAuthenticationProvider";
import { getSeasonTypeDisplayName } from "../../configs/nflSeasonTypes";

import useGetRoom from "../../hooks/room/useGetRoom";
import useGetRoomMembers from "../../hooks/membership/useGetRoomMembers";
import useGetRoomLeaderboard from "../../hooks/room/useGetRoomLeaderboard";
import useGetRoomBetsAll from "../../hooks/room/useGetRoomBetsAll";
import useGetRemovedBets from "../../hooks/bet/useGetRemovedBets";
import useGetBetsForRoom from "../../hooks/bet/useGetBetsForRoom";
import useCreateBet from "../../hooks/bet/useCreateBet";
import useGetCurrentNflWeek from "../../hooks/bet/useGetCurrentNflWeek";
import useGetNFLWeeksInRange from "../../hooks/odds/useGetNFLWeeksInRange";
import useGetMLBWeeksInRange from "../../hooks/odds/useGetMLBWeeksInRange";
import useGetNFLOdds from "../../hooks/odds/useGetNFLOdds";
import useGetMLBOdds from "../../hooks/odds/useGetMLBOdds";

// --- Leaf data hooks: mocked. Everything between them and the DOM is real. ---
// The factories are inlined rather than shared: `jest.mock` is hoisted above
// this module's own declarations, so a shared helper would be in its TDZ.
jest.mock("../../hooks/room/useGetRoom", () => ({
  __esModule: true,
  default: jest.fn(),
}));
jest.mock("../../hooks/membership/useGetRoomMembers", () => ({
  __esModule: true,
  default: jest.fn(),
}));
jest.mock("../../hooks/room/useGetRoomLeaderboard", () => ({
  __esModule: true,
  default: jest.fn(),
}));
jest.mock("../../hooks/room/useGetRoomBetsAll", () => ({
  __esModule: true,
  default: jest.fn(),
}));
jest.mock("../../hooks/bet/useGetRemovedBets", () => ({
  __esModule: true,
  default: jest.fn(),
}));
jest.mock("../../hooks/bet/useGetBetsForRoom", () => ({
  __esModule: true,
  default: jest.fn(),
}));
jest.mock("../../hooks/bet/useCreateBet", () => ({
  __esModule: true,
  default: jest.fn(),
}));
jest.mock("../../hooks/bet/useGetCurrentNflWeek", () => ({
  __esModule: true,
  default: jest.fn(),
}));
jest.mock("../../hooks/odds/useGetNFLWeeksInRange", () => ({
  __esModule: true,
  default: jest.fn(),
}));
jest.mock("../../hooks/odds/useGetMLBWeeksInRange", () => ({
  __esModule: true,
  default: jest.fn(),
}));
jest.mock("../../hooks/odds/useGetNFLOdds", () => ({
  __esModule: true,
  default: jest.fn(),
}));
jest.mock("../../hooks/odds/useGetMLBOdds", () => ({
  __esModule: true,
  default: jest.fn(),
}));

// --- Page furniture unrelated to week selection: stubbed out for focus. ---
jest.mock("../../components/room/RoomHeader", () => ({
  __esModule: true,
  default: () => null,
}));
jest.mock("../../components/room/RoomInfoSection", () => ({
  __esModule: true,
  default: () => null,
}));
jest.mock("../../components/room/RoomLeaderboard", () => ({
  __esModule: true,
  default: () => null,
}));
jest.mock("../../components/room/RoomBetsDisplay", () => ({
  __esModule: true,
  default: () => null,
}));
jest.mock("../../components/room/MembershipManagement", () => ({
  __esModule: true,
  default: () => null,
}));

// ---------------------------------------------------------------------------
// A tiny external store so mocked hooks can resolve after the initial render
// ---------------------------------------------------------------------------

const createScenarioStore = (initialState) => {
  let state = initialState;
  const listeners = new Set();
  return {
    getSnapshot: () => state,
    subscribe: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    /** Publish a partial update; every mocked hook re-renders. */
    set: (patch) => {
      state = { ...state, ...patch };
      listeners.forEach((listener) => listener());
    },
  };
};

let store;

/** Read the scenario as a real subscription, so `set` triggers a re-render. */
const useScenario = () =>
  useSyncExternalStore(store.subscribe, store.getSnapshot);

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const epochSeconds = (iso) => Math.floor(Date.parse(iso) / 1000);

/** A week entry in the shape `/odds/get_nfl_weeks_in_range` returns. */
const nflWeek = (year, seasonType, week, startIso, endIso) => ({
  year,
  season_type: seasonType,
  season_name: seasonType === 1 ? "preseason" : "regular_season",
  week,
  week_start_epoch: epochSeconds(startIso),
  week_end_epoch: epochSeconds(endIso),
});

// 2024 regular season weeks 1-3: Thu 00:00 ET through the following Wed 23:59 ET.
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

const NFL_RANGE = [REG_WEEK_1, REG_WEEK_2, REG_WEEK_3];

/** Mid Week 2 of the 2024 regular season. */
const DURING_NFL_WEEK_TWO = Date.parse("2024-09-15T18:00:00Z");

const mlbWeek = (week, startIso, endIso) => ({
  week,
  start: epochSeconds(startIso),
  end: epochSeconds(endIso),
});

// Mon 00:00:00 ET - Sun 23:59:59 ET.
const MLB_WEEK_1 = mlbWeek(1, "2024-07-01T04:00:00Z", "2024-07-08T03:59:59Z");
const MLB_WEEK_2 = mlbWeek(2, "2024-07-08T04:00:00Z", "2024-07-15T03:59:59Z");
const MLB_WEEK_3 = mlbWeek(3, "2024-07-15T04:00:00Z", "2024-07-22T03:59:59Z");

const MLB_RANGE = [MLB_WEEK_1, MLB_WEEK_2, MLB_WEEK_3];

/** Mid MLB Week 2. */
const DURING_MLB_WEEK_TWO = Date.parse("2024-07-10T18:00:00Z");

const NFL_ROOM = {
  room_id: "room-1",
  room_name: "Sunday Funday",
  sport: "NFL",
  public: true,
  start_date: REG_WEEK_1.week_start_epoch,
  end_date: REG_WEEK_3.week_end_epoch,
  nfl_weeks: [],
  admin_user_ids: [],
};

const MLB_ROOM = {
  ...NFL_ROOM,
  sport: "MLB",
  start_date: MLB_WEEK_1.start,
  end_date: MLB_WEEK_3.end,
};

/**
 * Stand-in for `useGetNFLWeeksInRange`, deriving its season helpers from the
 * supplied weeks exactly as the real hook does.
 */
const nflRangeState = ({ nflWeeks = [], isNFLWeeksFetching = false } = {}) => {
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
    isNFLWeeksFetching,
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

const EMPTY_NFL_RANGE = nflRangeState();

/** Stand-in for `useGetMLBWeeksInRange`. */
const mlbRangeState = ({
  availableWeeks = [],
  isMLBWeeksFetching = false,
} = {}) => ({
  availableWeeks,
  mlbWeeks: availableWeeks,
  isMLBWeeksFetching,
  isMLBWeeksError: false,
  getWeekByNumber: (weekNumber) =>
    availableWeeks.find((week) => week.week === weekNumber) || null,
});

const EMPTY_MLB_RANGE = mlbRangeState();

/** Stand-in for `useGetCurrentNflWeek` — the Authoritative_Week_Source. */
const authoritativeState = (overrides = {}) => ({
  currentWeekInfo: {},
  isFetching: false,
  isError: false,
  status: "success",
  error: null,
  refetch: jest.fn(),
  ...overrides,
});

/** The authoritative source is still in flight (Requirement 1.4). */
const AUTHORITATIVE_LOADING = authoritativeState({
  status: "loading",
  isFetching: true,
});

/** The authoritative source failed, so the fallback estimate is used (Req 1.5). */
const AUTHORITATIVE_FAILED = authoritativeState({
  status: "error",
  isError: true,
});

/**
 * An authoritative answer. Values arrive as strings the way ESPN expresses
 * them, which is the cross-type case Requirement 6.1 normalizes.
 */
const authoritativeWeek = (week, { year = 2024, seasonType = 2 } = {}) =>
  authoritativeState({
    currentWeekInfo: {
      is_off_season: false,
      season_year: String(year),
      season_type_value: String(seasonType),
      week_value: String(week),
      week_label: `Week ${week}`,
    },
  });

const noOdds = {
  nflOdds: [],
  mlbOdds: [],
  oddsByDay: [],
  oddsCount: 0,
  sport: "football",
  league: "nfl",
  isOddsFetching: false,
  isOddsError: false,
  oddsError: null,
  hasOdds: false,
};

const defaultScenario = () => ({
  room: NFL_ROOM,
  isRoomFetching: false,
  authoritative: authoritativeState(),
  nflRange: nflRangeState({ nflWeeks: NFL_RANGE }),
  mlbRange: EMPTY_MLB_RANGE,
});

// ---------------------------------------------------------------------------
// Harness
// ---------------------------------------------------------------------------

/** A syntactically valid unsigned JWT so `getUserIdFromToken` yields a user. */
const base64Url = (value) =>
  Buffer.from(JSON.stringify(value))
    .toString("base64")
    .replace(/=+$/, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");

const CURRENT_USER_ID = "user-1";
const ID_TOKEN = `${base64Url({ alg: "none", typ: "JWT" })}.${base64Url({
  sub: CURRENT_USER_ID,
})}.signature`;

const renderRoom = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <UserAuthenticationContext.Provider
        value={{ idToken: ID_TOKEN, isAuthenticated: true }}
      >
        <MemoryRouter initialEntries={["/rooms/room-1"]}>
          <Routes>
            <Route path="/rooms/:roomId" element={<Room />} />
          </Routes>
        </MemoryRouter>
      </UserAuthenticationContext.Provider>
    </QueryClientProvider>,
  );
};

/**
 * The current value of an antd `Select`.
 *
 * antd exposes no accessible name for the *selected* value — the combobox input
 * is the search field — so the value is read from the selection item inside the
 * control the accessible query found. The label lookup stays accessible; only
 * the value read reaches for antd's DOM.
 */
const selectedValueOf = (accessibleName) => {
  const combobox = screen.getByRole("combobox", { name: accessibleName });
  const item = combobox
    .closest(".ant-select")
    .querySelector(".ant-select-selection-item");
  return item ? item.textContent : null;
};

const isSelectDisabled = (accessibleName) =>
  screen
    .getByRole("combobox", { name: accessibleName })
    .closest(".ant-select")
    .classList.contains("ant-select-disabled");

/**
 * Open a `Select` and click one of its options, the way a user would.
 *
 * The control is found by its accessible name; the option is found by its text.
 * antd's *visible* options carry no `role="option"` — the role lives on a
 * parallel, visually hidden list it renders for screen readers, which holds the
 * raw values rather than the labels — so a role query cannot reach the clickable
 * element here.
 */
const chooseOption = async (accessibleName, optionText) => {
  fireEvent.mouseDown(screen.getByRole("combobox", { name: accessibleName }));
  const option = await screen.findByText(optionText, {
    selector: ".ant-select-item-option-content",
  });
  fireEvent.click(option.closest(".ant-select-item-option"));
};

beforeAll(() => {
  // jsdom ships no matchMedia; antd's responsive Row/Col needs one.
  if (!window.matchMedia) {
    window.matchMedia = (query) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    });
  }
});

beforeEach(() => {
  jest.useFakeTimers();
  jest.setSystemTime(DURING_NFL_WEEK_TWO);

  store = createScenarioStore(defaultScenario());

  // antd's static `message` mounts its own React root; the week handlers only
  // use it for a toast, which is not what this suite is about.
  jest.spyOn(message, "info").mockImplementation(() => {});

  useGetRoom.mockImplementation(() => {
    const scenario = useScenario();
    return {
      room: scenario.room,
      isRoomFetching: scenario.isRoomFetching,
      isRoomError: false,
      roomError: null,
      roomRefetch: jest.fn(),
    };
  });

  useGetCurrentNflWeek.mockImplementation(() => useScenario().authoritative);

  // Both range hooks are called twice per render — once by `Room.js` for the
  // room's sport and once stood down with nulls — so honour the null contract.
  useGetNFLWeeksInRange.mockImplementation((startDate) => {
    const scenario = useScenario();
    return startDate == null ? EMPTY_NFL_RANGE : scenario.nflRange;
  });

  useGetMLBWeeksInRange.mockImplementation((startDate) => {
    const scenario = useScenario();
    return startDate == null ? EMPTY_MLB_RANGE : scenario.mlbRange;
  });

  useGetNFLOdds.mockReturnValue(noOdds);
  useGetMLBOdds.mockReturnValue(noOdds);

  useGetRoomMembers.mockReturnValue({
    members: [{ user_id: CURRENT_USER_ID, status: "approved" }],
    isMembersFetching: false,
  });
  useGetRoomLeaderboard.mockReturnValue({
    leaderboard: [],
    isLeaderboardLoading: false,
    refetchLeaderboard: jest.fn(),
  });
  useGetRoomBetsAll.mockReturnValue({
    bets: [],
    users: {},
    isBetsLoading: false,
    refetchBets: jest.fn(),
  });
  useGetRemovedBets.mockReturnValue({
    removedBets: [],
    refetchRemovedBets: jest.fn(),
  });
  useGetBetsForRoom.mockReturnValue({
    bets: [],
    isBetsLoading: false,
    refetchBets: jest.fn(),
  });
  useCreateBet.mockReturnValue({ createBet: jest.fn(), isLoading: false });
});

afterEach(() => {
  jest.useRealTimers();
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("Room — NFL week resolving after the initial render", () => {
  it("shows a loading state for the week selection instead of a provisional week", () => {
    store.set({ authoritative: AUTHORITATIVE_LOADING });

    renderRoom();

    // The room's range already knows which week contains "now", but until the
    // authoritative source answers the page must not present any week as
    // confirmed (Requirement 1.4).
    expect(selectedValueOf("Week:")).toBeNull();
    expect(isSelectDisabled("Week:")).toBe(true);
    expect(screen.getByText("Finding the current week...")).toBeInTheDocument();
    expect(screen.getByText("Finding current week...")).toBeInTheDocument();

    // "Loading" and "estimated" would be contradictory; neither notice shows.
    expect(screen.queryByText("Estimated week")).not.toBeInTheDocument();
    expect(
      screen.queryByText("Current week not covered by this room"),
    ).not.toBeInTheDocument();
  });

  it("adopts the authoritative week once it resolves after the initial render", async () => {
    store.set({ authoritative: AUTHORITATIVE_LOADING });

    renderRoom();
    expect(selectedValueOf("Week:")).toBeNull();

    // The authoritative source answers Week 3 while the present moment sits
    // inside the range's Week 2 — so landing on Week 3 can only have come from
    // the authoritative source, not from client date math
    // (Requirements 1.1, 8.1).
    act(() => {
      store.set({ authoritative: authoritativeWeek(3) });
    });

    await waitFor(() => expect(selectedValueOf("Week:")).toBe("Week 3"));

    expect(isSelectDisabled("Week:")).toBe(false);
    expect(selectedValueOf("Year:")).toBe("2024");
    expect(selectedValueOf("Season Type:")).toBe(getSeasonTypeDisplayName(2));
    expect(
      screen.queryByText("Finding the current week..."),
    ).not.toBeInTheDocument();
    expect(screen.queryByText("Estimated week")).not.toBeInTheDocument();
  });

  it("adopts a late resolution even though a week is already displayed", async () => {
    // The exact shape of the old bug: the selection is already truthy when the
    // authoritative week arrives. Adoption must still happen (Requirement 1.3).
    renderRoom();

    await waitFor(() => expect(selectedValueOf("Week:")).toBe("Week 2"));

    act(() => {
      store.set({ authoritative: authoritativeWeek(1) });
    });

    await waitFor(() => expect(selectedValueOf("Week:")).toBe("Week 1"));
  });
});

describe("Room — NFL estimate and out-of-range messaging", () => {
  it("surfaces that the week is an estimate when the authoritative source fails", async () => {
    store.set({ authoritative: AUTHORITATIVE_FAILED });

    renderRoom();

    // The Fallback_Week_Source puts 2024-09-15 in Week 2, which this room
    // covers — so the page lands on a usable week but says it is a guess
    // (Requirement 1.5).
    await waitFor(() => expect(selectedValueOf("Week:")).toBe("Week 2"));

    expect(screen.getByText("Estimated week")).toBeInTheDocument();
    expect(
      screen.getByText(/couldn't confirm the current week/i),
    ).toBeInTheDocument();
    expect(
      screen.queryByText("Current week not covered by this room"),
    ).not.toBeInTheDocument();
  });

  it("says the current week is not covered when it falls outside the room's range", async () => {
    // The season is on Week 12; this room only runs through Week 3.
    store.set({ authoritative: authoritativeWeek(12) });

    renderRoom();

    await waitFor(() =>
      expect(
        screen.getByText("Current week not covered by this room"),
      ).toBeInTheDocument(),
    );

    // The nearest in-range week is selected rather than an empty control
    // (Requirements 1.6, 6.4).
    expect(selectedValueOf("Week:")).toBe("Week 2");
    // The out-of-range message is the more informative of the two and wins.
    expect(screen.queryByText("Estimated week")).not.toBeInTheDocument();
  });
});

describe("Room — deliberate selection survives a later resolution", () => {
  it("keeps the user's week when the authoritative source resolves again", async () => {
    store.set({ authoritative: authoritativeWeek(2) });

    renderRoom();
    await waitFor(() => expect(selectedValueOf("Week:")).toBe("Week 2"));

    await chooseOption("Week:", "Week 1");
    await waitFor(() => expect(selectedValueOf("Week:")).toBe("Week 1"));

    // A window-focus refetch answers with a different week. The user's
    // Deliberate_Selection outranks it (Requirements 2.2, 2.3, 8.5).
    act(() => {
      store.set({ authoritative: authoritativeWeek(3) });
    });

    await waitFor(() => expect(selectedValueOf("Week:")).toBe("Week 1"));
    expect(selectedValueOf("Week:")).toBe("Week 1");
  });
});

describe("Room — MLB", () => {
  const mlbScenario = (overrides = {}) => ({
    room: MLB_ROOM,
    isRoomFetching: false,
    authoritative: authoritativeState(),
    nflRange: EMPTY_NFL_RANGE,
    mlbRange: mlbRangeState({ availableWeeks: MLB_RANGE }),
    ...overrides,
  });

  beforeEach(() => {
    jest.setSystemTime(DURING_MLB_WEEK_TWO);
  });

  it("selects the week containing the present moment rather than Week 1", async () => {
    store.set(mlbScenario());

    renderRoom();

    await waitFor(() =>
      expect(selectedValueOf("MLB Week:")).toBe("Week 2 (Jul 8 - Jul 14)"),
    );
    expect(screen.queryByText("Estimated week")).not.toBeInTheDocument();
  });

  it("adopts the containing week when the room's range resolves late", async () => {
    store.set(
      mlbScenario({ mlbRange: mlbRangeState({ isMLBWeeksFetching: true }) }),
    );

    renderRoom();
    expect(screen.getByText("Loading MLB schedule...")).toBeInTheDocument();

    act(() => {
      store.set({ mlbRange: mlbRangeState({ availableWeeks: MLB_RANGE }) });
    });

    expect(
      await screen.findByRole("combobox", { name: "MLB Week:" }),
    ).toBeInTheDocument();
    await waitFor(() =>
      expect(selectedValueOf("MLB Week:")).toBe("Week 2 (Jul 8 - Jul 14)"),
    );
  });

  it("moves off an already-displayed week when the fuller range arrives", async () => {
    // MLB's version of the old bug: the range came back with only the first
    // week, the page showed Week 1, and because the state was no longer empty
    // the containing week was never adopted (Requirements 1.3, 8.6).
    store.set(
      mlbScenario({
        mlbRange: mlbRangeState({ availableWeeks: [MLB_WEEK_1] }),
      }),
    );

    renderRoom();
    await waitFor(() =>
      expect(selectedValueOf("MLB Week:")).toBe("Week 1 (Jul 1 - Jul 7)"),
    );

    act(() => {
      store.set({ mlbRange: mlbRangeState({ availableWeeks: MLB_RANGE }) });
    });

    await waitFor(() =>
      expect(selectedValueOf("MLB Week:")).toBe("Week 2 (Jul 8 - Jul 14)"),
    );
  });

  it("says the current week is not covered when the room's range misses it", async () => {
    jest.setSystemTime(Date.parse("2024-06-01T18:00:00Z"));
    store.set(mlbScenario());

    renderRoom();

    await waitFor(() =>
      expect(
        screen.getByText("Current week not covered by this room"),
      ).toBeInTheDocument(),
    );
    // The nearest upcoming week in range, not an empty control.
    expect(selectedValueOf("MLB Week:")).toBe("Week 1 (Jul 1 - Jul 7)");
  });

  it("keeps a deliberate week across a later range refetch", async () => {
    store.set(mlbScenario());

    renderRoom();
    await waitFor(() =>
      expect(selectedValueOf("MLB Week:")).toBe("Week 2 (Jul 8 - Jul 14)"),
    );

    await chooseOption("MLB Week:", "Week 3 (Jul 15 - Jul 21)");
    await waitFor(() =>
      expect(selectedValueOf("MLB Week:")).toBe("Week 3 (Jul 15 - Jul 21)"),
    );

    act(() => {
      // A refetch hands back a fresh array with identical contents.
      store.set({
        mlbRange: mlbRangeState({ availableWeeks: [...MLB_RANGE] }),
      });
    });

    await waitFor(() =>
      expect(selectedValueOf("MLB Week:")).toBe("Week 3 (Jul 15 - Jul 21)"),
    );
  });
});
