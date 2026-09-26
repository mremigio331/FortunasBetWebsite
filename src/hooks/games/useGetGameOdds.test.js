import React from "react";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import useGetGameOdds from "./useGetGameOdds";
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

describe("useGetGameOdds", () => {
  it("fetches odds for a single game", async () => {
    apiRequestGet.mockResolvedValue({
      data: {
        odds: { game_id: "401872953", spread: -7.0, overUnder: 50.5 },
        game_id: "401872953",
        hasOdds: true,
        message: "ok",
      },
    });

    const { result } = renderHook(
      () =>
        useGetGameOdds({
          sport: "football",
          league: "nfl",
          gameId: "401872953",
        }),
      { wrapper: makeWrapper() },
    );

    await waitFor(() => expect(result.current.hasOdds).toBe(true));
    expect(result.current.odds.spread).toBe(-7.0);

    const [, route] = apiRequestGet.mock.calls[0];
    expect(route).toContain("/games/odds?");
    expect(route).toContain("sport=football");
    expect(route).toContain("league=nfl");
    expect(route).toContain("game_id=401872953");
  });

  it("stays disabled when gameId is missing", async () => {
    renderHook(() => useGetGameOdds({ sport: "football", league: "nfl" }), {
      wrapper: makeWrapper(),
    });

    await new Promise((r) => setTimeout(r, 0));
    expect(apiRequestGet).not.toHaveBeenCalled();
  });

  it("stays disabled when enabled=false (e.g. game already started)", async () => {
    renderHook(
      () =>
        useGetGameOdds({
          sport: "football",
          league: "nfl",
          gameId: "1",
          enabled: false,
        }),
      { wrapper: makeWrapper() },
    );

    await new Promise((r) => setTimeout(r, 0));
    expect(apiRequestGet).not.toHaveBeenCalled();
  });
});
