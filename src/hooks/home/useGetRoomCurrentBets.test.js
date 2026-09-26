import React from "react";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import useGetRoomCurrentBets from "./useGetRoomCurrentBets";
import { apiRequestGet } from "../../api/apiRequest";
import { useApi } from "../../provider/ApiProvider";
import { UserAuthenticationContext } from "../../provider/UserAuthenticationProvider";

jest.mock("../../api/apiRequest", () => ({ apiRequestGet: jest.fn() }));
jest.mock("../../provider/ApiProvider", () => ({ useApi: jest.fn() }));

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
  useApi.mockReturnValue({ apiEndpoint: "https://api.test" });
});

describe("useGetRoomCurrentBets", () => {
  it("fetches a room's current-week bets", async () => {
    apiRequestGet.mockResolvedValue({
      data: {
        bets: { sport: "NFL", one_point: { game_id: "g1" } },
        room_sport: "NFL",
      },
    });

    const { result } = renderHook(() => useGetRoomCurrentBets("r1", true), {
      wrapper: makeWrapper(),
    });

    await waitFor(() => expect(result.current.roomSport).toBe("NFL"));
    expect(result.current.bets.one_point.game_id).toBe("g1");
    const [, route] = apiRequestGet.mock.calls[0];
    expect(route).toBe("/home/rooms/r1/current-bets");
  });

  it("stays disabled until enabled is true (lazy load)", async () => {
    const { rerender, result } = renderHook(
      ({ enabled }) => useGetRoomCurrentBets("r1", enabled),
      { wrapper: makeWrapper(), initialProps: { enabled: false } },
    );

    await new Promise((r) => setTimeout(r, 0));
    expect(apiRequestGet).not.toHaveBeenCalled();
    expect(result.current.bets).toEqual({});

    apiRequestGet.mockResolvedValue({ data: { bets: { sport: "NFL" } } });
    rerender({ enabled: true });
    await waitFor(() => expect(apiRequestGet).toHaveBeenCalledTimes(1));
  });

  it("stays disabled without a roomId", async () => {
    renderHook(() => useGetRoomCurrentBets(null, true), {
      wrapper: makeWrapper(),
    });
    await new Promise((r) => setTimeout(r, 0));
    expect(apiRequestGet).not.toHaveBeenCalled();
  });
});
