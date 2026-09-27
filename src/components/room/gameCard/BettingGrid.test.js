/**
 * BettingGrid — confirms each cell does what its label says: tapping a spread
 * cell submits a spread bet on that team with the exact signed line shown, and
 * tapping a total cell submits the matching over/under choice. This is the
 * guard against the class of bug where the displayed line and the recorded pick
 * disagree (the Green Bay +3.5 / -3.5 confusion).
 */
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import BettingGrid from "./BettingGrid";

// useIsMobile just toggles sizing; pin it so tests are deterministic.
jest.mock("../../../hooks/useIsMobile", () => ({
  __esModule: true,
  default: () => false,
}));

// Green Bay (away) favored by 3.5 at the NY Jets — the real bug case.
const game = (overrides = {}) => ({
  game_id: "401872936",
  spread: 3.5,
  favoredTeam: "away",
  overUnder: 44.5,
  status: { state: "pre" },
  teams: {
    away: { abbreviation: "GB" },
    home: { abbreviation: "NYJ" },
  },
  ...overrides,
});

const sportRules = {
  allowedPoints: [1, 2, 3],
  pointLimits: { 1: 1, 2: 1, 3: 1 },
  pointLabels: { 1: "1", 2: "2", 3: "3" },
  uniquePointsPerBet: true,
};

const renderGrid = (props = {}) => {
  const onSelectSpread = jest.fn();
  const onSelectTotal = jest.fn();
  const onPointsChange = jest.fn();
  render(
    <BettingGrid
      game={game(props.game)}
      bet={props.bet ?? { betType: "spread", teamChoice: null, points: 1 }}
      hasValidSpread
      hasValidTotal
      onSelectSpread={onSelectSpread}
      onSelectTotal={onSelectTotal}
      onPointsChange={onPointsChange}
      roomSport="NFL"
      sportRules={sportRules}
      weeklyTakenPoints={[]}
      duplicatePointValues={[]}
      sessionPointCounts={{}}
    />,
  );
  return { onSelectSpread, onSelectTotal, onPointsChange };
};

describe("BettingGrid — labels match actions", () => {
  it("shows the favorite (GB) at -3.5 and the underdog (NYJ) at +3.5", () => {
    renderGrid();
    // Buttons are labeled with the signed line text.
    expect(screen.getByText("-3.5")).toBeInTheDocument();
    expect(screen.getByText("+3.5")).toBeInTheDocument();
  });

  it("tapping the GB spread cell submits away with the -3.5 line", () => {
    const { onSelectSpread } = renderGrid();
    fireEvent.click(screen.getByText("-3.5"));
    expect(onSelectSpread).toHaveBeenCalledWith(
      "401872936",
      expect.objectContaining({ teamChoice: "away", takenLine: -3.5 }),
    );
  });

  it("tapping the NYJ spread cell submits home with the +3.5 line", () => {
    const { onSelectSpread } = renderGrid();
    fireEvent.click(screen.getByText("+3.5"));
    expect(onSelectSpread).toHaveBeenCalledWith(
      "401872936",
      expect.objectContaining({ teamChoice: "home", takenLine: 3.5 }),
    );
  });

  it("tapping the Over cell submits over", () => {
    const { onSelectTotal } = renderGrid();
    fireEvent.click(screen.getByText("O 44.5"));
    expect(onSelectTotal).toHaveBeenCalledWith(
      "401872936",
      expect.objectContaining({ overUnderChoice: "over" }),
    );
  });

  it("tapping the Under cell submits under", () => {
    const { onSelectTotal } = renderGrid();
    fireEvent.click(screen.getByText("U 44.5"));
    expect(onSelectTotal).toHaveBeenCalledWith(
      "401872936",
      expect.objectContaining({ overUnderChoice: "under" }),
    );
  });

  it("tapping a points button reports that point value", () => {
    const { onPointsChange } = renderGrid();
    fireEvent.click(screen.getByText("2"));
    expect(onPointsChange).toHaveBeenCalledWith("401872936", 2);
  });

  it("disables spread cells when there is no valid spread", () => {
    const onSelectSpread = jest.fn();
    render(
      <BettingGrid
        game={game({ spread: null, favoredTeam: null })}
        bet={{ betType: "spread", points: 1 }}
        hasValidSpread={false}
        hasValidTotal
        onSelectSpread={onSelectSpread}
        onSelectTotal={jest.fn()}
        onPointsChange={jest.fn()}
        roomSport="NFL"
        sportRules={sportRules}
        weeklyTakenPoints={[]}
        duplicatePointValues={[]}
        sessionPointCounts={{}}
      />,
    );
    const naCells = screen.getAllByText("N/A");
    expect(naCells.length).toBe(2); // both spread cells
    fireEvent.click(naCells[0]);
    expect(onSelectSpread).not.toHaveBeenCalled();
  });

  it("renders a home favorite correctly (sign flips)", () => {
    // Home (NYJ) favored: away (GB) is the underdog at +3.5, home at -3.5.
    const { onSelectSpread } = renderGrid({ game: { favoredTeam: "home" } });
    // Tapping the away (GB) +3.5 cell records the underdog line for away.
    fireEvent.click(screen.getByText("+3.5"));
    expect(onSelectSpread).toHaveBeenCalledWith(
      "401872936",
      expect.objectContaining({ teamChoice: "away", takenLine: 3.5 }),
    );
  });
});
