import React from "react";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import useGetStandingsMembers from "./useGetStandingsMembers";
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

describe("useGetStandingsMembers", () => {
  it("fetches active members from the standings endpoint", async () => {
    apiRequestGet.mockResolvedValue({
      data: { members: [{ user_id: "u1" }, { user_id: "u2" }], count: 2 },
    });
    const { result } = renderHook(() => useGetStandingsMembers("r1"), {
      wrapper: makeWrapper(),
    });
    await waitFor(() => expect(result.current.memberCount).toBe(2));
    const [, route] = apiRequestGet.mock.calls[0];
    expect(route).toBe("/room/r1/standings/members");
  });

  it("stays disabled without a roomId", async () => {
    renderHook(() => useGetStandingsMembers(null), { wrapper: makeWrapper() });
    await new Promise((r) => setTimeout(r, 0));
    expect(apiRequestGet).not.toHaveBeenCalled();
  });
});
