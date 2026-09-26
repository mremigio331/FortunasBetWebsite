import React from "react";
import { render, screen } from "@testing-library/react";

import GameCardWithOdds from "./GameCardWithOdds";
import useGetGameOdds from "../../../hooks/games/useGetGameOdds";

jest.mock("../../../hooks/games/useGetGameOdds", () => ({
  __esModule: true,
  default: jest.fn(),
}));

// Render GameCard as a lightweight probe so we can assert what the wrapper
// passes down (merged odds + loading flags) without pulling in the full card.
jest.mock("./GameCard", () => ({
  __esModule: true,
  default: (props) => (
    <div
      data-testid="game-card"
      data-spread={String(props.game.spread)}
      data-over-under={String(props.game.overUnder)}
      data-odds-loading={String(props.oddsLoading)}
      data-odds-error={String(props.oddsError)}
    />
  ),
}));

const preGame = (overrides = {}) => ({
  game_id: "401872953",
  status: { state: "pre" },
  spread: null,
  overUnder: null,
  teams: { home: {}, away: {} },
  ...overrides,
});

const NONE = {
  odds: null,
  hasOdds: false,
  isOddsFetching: false,
  isOddsError: false,
  oddsRefetch: jest.fn(),
};

describe("GameCardWithOdds", () => {
  it("fetches odds for a not-started game and shows loading", () => {
    useGetGameOdds.mockReturnValue({ ...NONE, isOddsFetching: true });

    render(<GameCardWithOdds game={preGame()} sport="football" league="nfl" />);

    // Odds fetch enabled for a pre-game without a line.
    expect(useGetGameOdds).toHaveBeenCalledWith(
      expect.objectContaining({
        sport: "football",
        league: "nfl",
        gameId: "401872953",
        enabled: true,
      }),
    );
    expect(screen.getByTestId("game-card").dataset.oddsLoading).toBe("true");
  });

  it("merges fetched odds into the game object", () => {
    useGetGameOdds.mockReturnValue({
      ...NONE,
      hasOdds: true,
      odds: { spread: -7, overUnder: 50.5, favoredTeam: "home" },
    });

    render(<GameCardWithOdds game={preGame()} sport="football" league="nfl" />);

    const card = screen.getByTestId("game-card");
    expect(card.dataset.spread).toBe("-7");
    expect(card.dataset.overUnder).toBe("50.5");
  });

  it("does not fetch odds for a started game", () => {
    useGetGameOdds.mockReturnValue(NONE);

    render(
      <GameCardWithOdds
        game={preGame({ status: { state: "in" } })}
        sport="football"
        league="nfl"
      />,
    );

    expect(useGetGameOdds).toHaveBeenCalledWith(
      expect.objectContaining({ enabled: false }),
    );
  });

  it("does not re-fetch when the game already carries odds", () => {
    useGetGameOdds.mockReturnValue(NONE);

    render(
      <GameCardWithOdds
        game={preGame({ spread: -3 })}
        sport="football"
        league="nfl"
      />,
    );

    expect(useGetGameOdds).toHaveBeenCalledWith(
      expect.objectContaining({ enabled: false }),
    );
  });
});
