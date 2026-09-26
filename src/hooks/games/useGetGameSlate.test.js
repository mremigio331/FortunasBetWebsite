import React from "react";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import useGetGameSlate from "./useGetGameSlate";
import { apiRequestGet } from "../../api/apiRequest";
import { useApi } from "../../provider/ApiProvider";
import { UserAuthenticationContext } from "../../provider/UserAuthenticationProvider";

jest.mock("../../api/apiRequest", () => ({
  apiRequestGet: jest.fn(),
}));
jest.mock("../../provider/ApiProvider", () => ({
  useApi: jest.fn(),
}));

const makeWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }) => (
    <QueryClientProvider client={queryClient}>
      <UserAuthenticationContext.Provider value={{ idToken: "test-token" }}>
        {children}
      </UserAuthenticationContext.Provider>
    </QueryClientProvider>
  );
};

beforeEach(() => {
  useApi.mockReturnValue({ apiEndpoint: "https://api.test", stage: "testing" });
});

describe("useGetGameSlate", () => {
  it("fetches the NFL slate and exposes games", async () => {
    apiRequestGet.mockResolvedValue({
      data: {
        message: "ok",
        games: [{ game_id: "1" }, { game_id: "2" }],
        count: 2,
        sport: "football",
        league: "nfl",
        week: 4,
        year: 2025,
        season_type: 2,
        date: null,
      },
    });

    const { result } = renderHook(
      () =>
        useGetGameSlate({
          sport: "football",
          league: "nfl",
          week: 4,
          year: 2025,
        }),
      { wrapper: makeWrapper() },
    );

    await waitFor(() => expect(result.current.hasGames).toBe(true));
    expect(result.current.gamesCount).toBe(2);
    expect(result.current.games).toHaveLength(2);

    const [, route] = apiRequestGet.mock.calls[0];
    expect(route).toContain("/games/slate?");
    expect(route).toContain("sport=football");
    expect(route).toContain("league=nfl");
    expect(route).toContain("week=4");
    expect(route).toContain("year=2025");
    expect(route).toContain("season_type=2");
  });

  it("builds a date query for MLB and does not require week/year", async () => {
    apiRequestGet.mockResolvedValue({
      data: {
        games: [{ game_id: "9" }],
        count: 1,
        sport: "baseball",
        league: "mlb",
        date: "20250920",
      },
    });

    const { result } = renderHook(
      () =>
        useGetGameSlate({
          sport: "baseball",
          league: "mlb",
          date: "20250920",
        }),
      { wrapper: makeWrapper() },
    );

    await waitFor(() => expect(result.current.hasGames).toBe(true));
    const [, route] = apiRequestGet.mock.calls[0];
    expect(route).toContain("date=20250920");
    expect(route).not.toContain("week=");
  });

  it("does not fire when NFL params are missing", async () => {
    const { result } = renderHook(
      () => useGetGameSlate({ sport: "football", league: "nfl" }),
      { wrapper: makeWrapper() },
    );

    // Give react-query a tick; the query should stay disabled.
    await new Promise((r) => setTimeout(r, 0));
    expect(apiRequestGet).not.toHaveBeenCalled();
    expect(result.current.games).toEqual([]);
  });

  it("reports isSlatePending while enabled but before data arrives", async () => {
    // A never-resolving request keeps the query enabled with no data yet.
    apiRequestGet.mockReturnValue(new Promise(() => {}));

    const { result } = renderHook(
      () =>
        useGetGameSlate({
          sport: "football",
          league: "nfl",
          week: 4,
          year: 2025,
        }),
      { wrapper: makeWrapper() },
    );

    await waitFor(() => expect(result.current.isSlatePending).toBe(true));
    expect(result.current.hasGames).toBe(false);
  });

  it("is not pending when disabled (missing params)", async () => {
    const { result } = renderHook(
      () => useGetGameSlate({ sport: "football", league: "nfl" }),
      { wrapper: makeWrapper() },
    );

    await new Promise((r) => setTimeout(r, 0));
    expect(result.current.isSlatePending).toBe(false);
  });

  it("does not fire when disabled", async () => {
    renderHook(
      () =>
        useGetGameSlate({
          sport: "football",
          league: "nfl",
          week: 4,
          year: 2025,
          enabled: false,
        }),
      { wrapper: makeWrapper() },
    );

    await new Promise((r) => setTimeout(r, 0));
    expect(apiRequestGet).not.toHaveBeenCalled();
  });
});
