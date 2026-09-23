/**
 * `useBetSelection` — regression coverage for the spread `spread_value` bug.
 *
 * The old submit handler read `game.homeSpread` / `game.awaySpread`, fields that
 * do not exist on the odds object, so every spread bet was persisted with
 * `spread_value: undefined`. The fix resolves the signed line from the line
 * captured at selection time (`bet.takenLine`), falling back to deriving it from
 * the odds `spread` magnitude + `favoredTeam` (the same derivation GameCard uses
 * to render the per-side lines).
 */

import { renderHook, act } from "@testing-library/react";
import useBetSelection from "./useBetSelection";

// react-query's useQueryClient is used only for cache invalidation on submit.
jest.mock("@tanstack/react-query", () => ({
  __esModule: true,
  useQueryClient: () => ({ invalidateQueries: jest.fn() }),
}));

jest.mock("antd", () => ({
  __esModule: true,
  message: {
    info: jest.fn(),
    success: jest.fn(),
    error: jest.fn(),
    warning: jest.fn(),
  },
}));

const GAME_ID = "401-home-away";

/** A pre-game NFL matchup with a home favorite by 3.5. */
const game = (overrides = {}) => ({
  game_id: GAME_ID,
  date: "2024-09-08T17:00:00Z",
  spread: 3.5,
  favoredTeam: "home",
  overUnder: 44.5,
  status: { state: "pre" },
  teams: {
    home: { abbreviation: "KC" },
    away: { abbreviation: "BAL" },
  },
  ...overrides,
});

const setup = (overrides = {}) => {
  const createBet = jest.fn().mockResolvedValue({});
  const refetchBets = jest.fn();
  const hook = renderHook(() =>
    useBetSelection({
      roomId: "room-1",
      currentUserId: "user-1",
      existingBets: [],
      selectedWeek: 1,
      selectedSeasonType: 2,
      selectedYear: 2024,
      sport: "football",
      league: "nfl",
      roomSport: "NFL",
      nflOdds: [game(overrides.game)],
      createBet,
      refetchBets,
    }),
  );
  return { ...hook, createBet, refetchBets };
};

/** Pull the single game_bet passed to createBet for the given call. */
const gameBetFrom = (createBet, callIndex = 0) =>
  createBet.mock.calls[callIndex][0].game_bet;

describe("useBetSelection — spread_value on submit", () => {
  it("uses the line captured at selection time (bet.takenLine)", async () => {
    const { result, createBet } = setup();

    // Select the game, then pick a team, which is where takenLine is recorded.
    act(() => result.current.handleGameSelect(GAME_ID));
    act(() =>
      result.current.handleTeamChoiceChange(GAME_ID, {
        teamChoice: "home",
        takenLine: -3.5,
      }),
    );

    await act(async () => {
      await result.current.handleSubmitBets();
    });

    expect(createBet).toHaveBeenCalledTimes(1);
    const gameBet = gameBetFrom(createBet);
    expect(gameBet.bet_type).toBe("spread");
    expect(gameBet.team_choice).toBe("home");
    expect(gameBet.spread_value).toBe(-3.5);
  });

  it("records the underdog's positive line when the away side is taken", async () => {
    const { result, createBet } = setup();

    act(() => result.current.handleGameSelect(GAME_ID));
    act(() =>
      result.current.handleTeamChoiceChange(GAME_ID, {
        teamChoice: "away",
        takenLine: 3.5,
      }),
    );

    await act(async () => {
      await result.current.handleSubmitBets();
    });

    expect(gameBetFrom(createBet).spread_value).toBe(3.5);
  });

  it("derives the signed line from spread + favoredTeam when takenLine is absent", async () => {
    // The default selection (home) never sets takenLine. The fallback must
    // reconstruct -3.5 for the favorite from the odds fields.
    const { result, createBet } = setup();

    act(() => result.current.handleGameSelect(GAME_ID));

    await act(async () => {
      await result.current.handleSubmitBets();
    });

    const gameBet = gameBetFrom(createBet);
    expect(gameBet.team_choice).toBe("home");
    expect(gameBet.spread_value).toBe(-3.5);
  });

  it("derives a positive line for the underdog side via the fallback", async () => {
    // Away team on a home-favored game is the underdog: +3.5.
    const { result, createBet } = setup();

    act(() => result.current.handleGameSelect(GAME_ID));
    // Change only the team choice without a takenLine (exercises the fallback).
    act(() =>
      result.current.handleTeamChoiceChange(GAME_ID, { teamChoice: "away" }),
    );

    await act(async () => {
      await result.current.handleSubmitBets();
    });

    expect(gameBetFrom(createBet).spread_value).toBe(3.5);
  });

  it("never submits a spread bet with an undefined spread_value", async () => {
    const { result, createBet } = setup();

    act(() => result.current.handleGameSelect(GAME_ID));

    await act(async () => {
      await result.current.handleSubmitBets();
    });

    const gameBet = gameBetFrom(createBet);
    expect(gameBet).toHaveProperty("spread_value");
    expect(gameBet.spread_value).not.toBeUndefined();
    expect(gameBet.spread_value).not.toBeNull();
  });

  it("does not submit a spread bet when the game has no spread line", async () => {
    // No takenLine and no spread magnitude to derive from: the bet must not be
    // silently persisted with a missing line.
    const { result, createBet } = setup({
      game: { spread: null, favoredTeam: null },
    });

    act(() => result.current.handleGameSelect(GAME_ID));

    await act(async () => {
      await result.current.handleSubmitBets();
    });

    expect(createBet).not.toHaveBeenCalled();
  });
});

describe("useBetSelection — over/under is unaffected", () => {
  it("submits total_value and no spread_value for an over/under bet", async () => {
    const { result, createBet } = setup();

    act(() => result.current.handleGameSelect(GAME_ID));
    act(() => result.current.handleBetTypeChange(GAME_ID, "overUnder"));
    act(() =>
      result.current.handleTeamChoiceChange(GAME_ID, {
        overUnderChoice: "over",
      }),
    );

    await act(async () => {
      await result.current.handleSubmitBets();
    });

    const gameBet = gameBetFrom(createBet);
    expect(gameBet.bet_type).toBe("over_under");
    expect(gameBet.over_under_choice).toBe("over");
    expect(gameBet.total_value).toBe(44.5);
    expect(gameBet).not.toHaveProperty("spread_value");
  });
});

describe("useBetSelection — grid selection handlers", () => {
  it("handleSelectSpread submits a spread bet with the captured line", async () => {
    const { result, createBet } = setup();

    act(() => result.current.handleGameSelect(GAME_ID));
    act(() =>
      result.current.handleSelectSpread(GAME_ID, {
        teamChoice: "away",
        takenLine: 3.5,
      }),
    );

    await act(async () => {
      await result.current.handleSubmitBets();
    });

    const gameBet = gameBetFrom(createBet);
    expect(gameBet.bet_type).toBe("spread");
    expect(gameBet.team_choice).toBe("away");
    expect(gameBet.spread_value).toBe(3.5);
    expect(gameBet).not.toHaveProperty("over_under_choice");
  });

  it("handleSelectTotal submits an over/under bet and clears spread state", async () => {
    const { result, createBet } = setup();

    act(() => result.current.handleGameSelect(GAME_ID));
    // First pick a spread, then switch to a total via the grid.
    act(() =>
      result.current.handleSelectSpread(GAME_ID, {
        teamChoice: "home",
        takenLine: -3.5,
      }),
    );
    act(() =>
      result.current.handleSelectTotal(GAME_ID, { overUnderChoice: "under" }),
    );

    await act(async () => {
      await result.current.handleSubmitBets();
    });

    const gameBet = gameBetFrom(createBet);
    expect(gameBet.bet_type).toBe("over_under");
    expect(gameBet.over_under_choice).toBe("under");
    expect(gameBet.total_value).toBe(44.5);
    expect(gameBet).not.toHaveProperty("spread_value");
    expect(gameBet).not.toHaveProperty("team_choice");
  });

  it("switching from total back to spread records the new line and drops the total", async () => {
    const { result, createBet } = setup();

    act(() => result.current.handleGameSelect(GAME_ID));
    act(() =>
      result.current.handleSelectTotal(GAME_ID, { overUnderChoice: "over" }),
    );
    act(() =>
      result.current.handleSelectSpread(GAME_ID, {
        teamChoice: "away",
        takenLine: 3.5,
      }),
    );

    await act(async () => {
      await result.current.handleSubmitBets();
    });

    const gameBet = gameBetFrom(createBet);
    expect(gameBet.bet_type).toBe("spread");
    expect(gameBet.team_choice).toBe("away");
    expect(gameBet.spread_value).toBe(3.5);
    expect(gameBet).not.toHaveProperty("over_under_choice");
    expect(gameBet).not.toHaveProperty("total_value");
  });
});
