import React from "react";
import { render, screen } from "@testing-library/react";

import StandingsBetsLoader from "./StandingsBetsLoader";
import useGetStandingsMembers from "../../hooks/room/useGetStandingsMembers";
import useGetUserRoomBets from "../../hooks/room/useGetUserRoomBets";

jest.mock("../../hooks/room/useGetStandingsMembers", () => ({
  __esModule: true,
  default: jest.fn(),
}));
jest.mock("../../hooks/room/useGetUserRoomBets", () => ({
  __esModule: true,
  default: jest.fn(),
}));

// Stub the heavy display so we only assert the loader's progress behaviour.
jest.mock("./RoomBetsDisplay", () => ({
  __esModule: true,
  default: ({ existingBets, loadingBanner }) => (
    <div data-testid="bets-display" data-count={existingBets.length}>
      {loadingBanner}
    </div>
  ),
}));

describe("StandingsBetsLoader", () => {
  it("shows a finding-players state while members load", () => {
    useGetStandingsMembers.mockReturnValue({ members: [], isLoading: true });
    useGetUserRoomBets.mockReturnValue({ bets: [], isLoading: false });

    render(<StandingsBetsLoader roomId="r1" />);
    expect(screen.getByText(/Finding players/i)).toBeInTheDocument();
    expect(screen.queryByTestId("bets-display")).not.toBeInTheDocument();
  });

  it("shows found-count and loading progress while user bets stream in", () => {
    useGetStandingsMembers.mockReturnValue({
      members: [{ user_id: "u1" }, { user_id: "u2" }],
      isLoading: false,
    });
    // Both users still loading -> progress banner visible, display rendered.
    useGetUserRoomBets.mockReturnValue({ bets: [], isLoading: true });

    render(<StandingsBetsLoader roomId="r1" />);
    expect(screen.getByText(/Found 2 players/i)).toBeInTheDocument();
    expect(
      screen.getByText(/loading their bets \(0\/2\)/i),
    ).toBeInTheDocument();
    expect(screen.getByTestId("bets-display")).toBeInTheDocument();
  });

  it("hides the progress banner once all users are loaded", () => {
    useGetStandingsMembers.mockReturnValue({
      members: [{ user_id: "u1" }],
      isLoading: false,
    });
    useGetUserRoomBets.mockReturnValue({
      bets: [{ game_id: "g1" }],
      isLoading: false,
    });

    render(<StandingsBetsLoader roomId="r1" />);
    expect(screen.queryByText(/loading their bets/i)).not.toBeInTheDocument();
    expect(screen.getByTestId("bets-display").dataset.count).toBe("1");
  });
});
