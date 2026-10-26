import React from "react";
import { render, screen } from "@testing-library/react";
import GameCardHeader from "./GameCardHeader";

const baseGame = {
  date: "2026-11-01T18:00Z",
  venue: { name: "Acrisure Stadium", city: "Pittsburgh", state: "PA" },
  status: { state: "pre", shortDetail: "11/1 - 1:00 PM EST" },
  weather: { displayValue: "Rain", temperature: 60, conditionId: "18" },
};

describe("GameCardHeader weather", () => {
  it("shows the forecast for an upcoming outdoor game", () => {
    render(<GameCardHeader game={baseGame} roomSport="NFL" />);
    expect(screen.getByText(/Rain · 60°F/)).toBeInTheDocument();
  });

  it("hides the forecast for indoor venues", () => {
    const game = { ...baseGame, venue: { ...baseGame.venue, indoor: true } };
    render(<GameCardHeader game={game} roomSport="NFL" />);
    expect(screen.queryByText(/Rain/)).not.toBeInTheDocument();
  });

  it("hides the forecast once the game has started", () => {
    const game = { ...baseGame, status: { state: "in", period: 1 } };
    render(<GameCardHeader game={game} roomSport="NFL" />);
    expect(screen.queryByText(/Rain/)).not.toBeInTheDocument();
  });

  it("renders nothing when ESPN has no forecast", () => {
    const game = { ...baseGame, weather: null };
    render(<GameCardHeader game={game} roomSport="NFL" />);
    expect(screen.queryByText(/°F/)).not.toBeInTheDocument();
  });
});
