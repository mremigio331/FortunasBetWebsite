import React from "react";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import useGetUserRoomBets from "./useGetUserRoomBets";
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

beforeEach(() => useApi.mockReturnValue({ apiEndpoint: "https://api.test" }));

describe("useGetUserRoomBets", () => {
  it("fetches one user's bets for the room", async () => {
    apiRequestGet.mockResolvedValue({
      data: { bets: [{ game_id: "g1" }], count: 1, user_id: "u2" },
    });
    const { result } = renderHook(() => useGetUserRoomBets("r1", "u2"), {
      wrapper: makeWrapper(),
    });
    await waitFor(() => expect(result.current.betCount).toBe(1));
    const [, route] = apiRequestGet.mock.calls[0];
    expect(route).toBe("/room/r1/bets/user/u2");
  });

  it("stays disabled until enabled and ids are present", async () => {
    const { rerender } = renderHook(
      ({ enabled }) => useGetUserRoomBets("r1", "u2", enabled),
      { wrapper: makeWrapper(), initialProps: { enabled: false } },
    );
    await new Promise((r) => setTimeout(r, 0));
    expect(apiRequestGet).not.toHaveBeenCalled();

    apiRequestGet.mockResolvedValue({ data: { bets: [], count: 0 } });
    rerender({ enabled: true });
    await waitFor(() => expect(apiRequestGet).toHaveBeenCalledTimes(1));
  });

  it("stays disabled without a userId", async () => {
    renderHook(() => useGetUserRoomBets("r1", null, true), {
      wrapper: makeWrapper(),
    });
    await new Promise((r) => setTimeout(r, 0));
    expect(apiRequestGet).not.toHaveBeenCalled();
  });
});
