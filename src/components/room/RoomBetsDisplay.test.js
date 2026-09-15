/**
 * `RoomBetsDisplay` — coverage for the loading/loaded transition.
 *
 * Background: the component previously returned a loading Card from an early
 * `if (isFetching)` branch placed BEFORE its hook calls (useIsMobile,
 * useContext, useState, useUpdateBet, useRemoveBet, useMemo...), which is a
 * Rules-of-Hooks violation because the hook count changes with `isFetching`.
 * The fix moves the loading return below every hook.
 *
 * These tests exercise the behavior that must hold once the ordering is fixed:
 * the component renders the loading state while fetching, renders the loaded
 * view (with its memoized stats/derived values) once fetching completes, and
 * survives repeated toggles in both directions. They also assert that React
 * logs no Rules-of-Hooks warning to console.error during those transitions.
 *
 * Note: React 18 does not always surface a hook-count mismatch as a thrown
 * error under jsdom, so these tests verify observable render behavior plus the
 * absence of a hook-order warning rather than relying on a hard throw.
 */

import React from "react";
import { render, screen } from "@testing-library/react";
import RoomBetsDisplay from "./RoomBetsDisplay";
import { UserAuthenticationContext } from "../../provider/UserAuthenticationProvider";

// Isolate the component from the heavy child render tree and data hooks; this
// test is about hook-call ordering in RoomBetsDisplay itself.
jest.mock("../../hooks/useIsMobile", () => ({
  __esModule: true,
  default: () => false,
}));
jest.mock("../../hooks/bet/useUpdateBet", () => ({
  __esModule: true,
  default: () => ({ updateBet: jest.fn(), isLoading: false }),
}));
jest.mock("../../hooks/bet/useRemoveBet", () => ({
  __esModule: true,
  default: () => ({ removeBet: jest.fn(), isLoading: false }),
}));
jest.mock("./RoomChart", () => ({
  __esModule: true,
  default: () => <div data-testid="room-chart" />,
}));
jest.mock("./RoomBetsTable", () => ({
  __esModule: true,
  default: () => <div data-testid="room-bets-table" />,
}));
jest.mock("./RoomBetsCards", () => ({
  __esModule: true,
  default: () => <div data-testid="room-bets-cards" />,
}));
jest.mock("./BetCard", () => ({
  __esModule: true,
  default: () => <div data-testid="bet-card" />,
}));
jest.mock("./EditBetModal", () => ({
  __esModule: true,
  default: () => null,
}));

const AUTH_VALUE = {
  isAuthenticated: true,
  idToken: "token",
  accessToken: "token",
};

const BETS = [
  {
    user_id: "user-1",
    game_id: "g1",
    points_wagered: 2,
    total_points_earned: 2,
    game_bet: { result: "win" },
    event_datetime: 1_700_000_000,
  },
];

const USERS = [{ user_id: "user-1", user_name: "Alice", user_color: "blue" }];

const renderDisplay = (props) =>
  render(
    <UserAuthenticationContext.Provider value={AUTH_VALUE}>
      <RoomBetsDisplay
        roomId="room-1"
        existingBets={BETS}
        users={USERS}
        roomSport="NFL"
        refetchBets={jest.fn()}
        {...props}
      />
    </UserAuthenticationContext.Provider>,
  );

/**
 * React surfaces a hook-order mismatch ("React has detected a change in the
 * order of Hooks" / "Rendered fewer hooks than expected") by logging to
 * console.error during the offending render, and — in this component — by then
 * throwing a downstream TypeError because a hook returned undefined. We assert
 * on BOTH channels so the regression can't slip through either one.
 */
const hookOrderError = (spy) =>
  spy.mock.calls.some((args) =>
    args.some(
      (arg) =>
        typeof arg === "string" &&
        (/rendered fewer hooks/i.test(arg) ||
          /change in the order of hooks/i.test(arg) ||
          /rules of hooks/i.test(arg)),
    ),
  );

const rerenderWith = (rerender, isFetching) =>
  rerender(
    <UserAuthenticationContext.Provider value={AUTH_VALUE}>
      <RoomBetsDisplay
        roomId="room-1"
        existingBets={BETS}
        users={USERS}
        roomSport="NFL"
        refetchBets={jest.fn()}
        isFetching={isFetching}
      />
    </UserAuthenticationContext.Provider>,
  );

describe("RoomBetsDisplay — Rules of Hooks across isFetching", () => {
  let errorSpy;

  beforeEach(() => {
    errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    errorSpy.mockRestore();
  });

  it("keeps a stable hook order when isFetching flips from true to false", () => {
    const { rerender } = renderDisplay({ isFetching: true });
    expect(screen.getByText("Loading bets...")).toBeInTheDocument();

    // The regression path: hooks were skipped during the loading render, so the
    // transition to the loaded render changed the hook count.
    expect(() => rerenderWith(rerender, false)).not.toThrow();

    expect(hookOrderError(errorSpy)).toBe(false);
    expect(screen.queryByText("Loading bets...")).not.toBeInTheDocument();
    expect(screen.getAllByText(/total/i).length).toBeGreaterThan(0);
  });

  it("keeps a stable hook order when isFetching flips from false to true", () => {
    const { rerender } = renderDisplay({ isFetching: false });
    expect(screen.queryByText("Loading bets...")).not.toBeInTheDocument();

    // Going loaded -> loading is where the buggy component rendered FEWER hooks
    // than the prior render, which is what React explicitly rejects.
    expect(() => rerenderWith(rerender, true)).not.toThrow();

    expect(hookOrderError(errorSpy)).toBe(false);
    expect(screen.getByText("Loading bets...")).toBeInTheDocument();
  });

  it("survives repeated isFetching toggles without a hook-order error", () => {
    const { rerender } = renderDisplay({ isFetching: true });

    expect(() => {
      rerenderWith(rerender, false);
      rerenderWith(rerender, true);
      rerenderWith(rerender, false);
      rerenderWith(rerender, true);
    }).not.toThrow();

    expect(hookOrderError(errorSpy)).toBe(false);
  });

  it("renders the loaded view without error when not fetching", () => {
    expect(() => renderDisplay({ isFetching: false })).not.toThrow();
    expect(hookOrderError(errorSpy)).toBe(false);
    expect(screen.getByText("Room Bets")).toBeInTheDocument();
  });
});
