import React from "react";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import useGetHomeRooms from "./useGetHomeRooms";
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

describe("useGetHomeRooms", () => {
  it("fetches the room list from /home/rooms", async () => {
    apiRequestGet.mockResolvedValue({
      data: {
        rooms: [
          { room_id: "r1", room_name: "Alpha", room_sport: "NFL" },
          { room_id: "r2", room_name: "Bravo", room_sport: "MLB" },
        ],
        room_count: 2,
      },
    });

    const { result } = renderHook(() => useGetHomeRooms(true), {
      wrapper: makeWrapper(),
    });

    await waitFor(() => expect(result.current.roomCount).toBe(2));
    expect(result.current.rooms).toHaveLength(2);
    const [, route] = apiRequestGet.mock.calls[0];
    expect(route).toBe("/home/rooms");
  });

  it("does not fetch when disabled", async () => {
    renderHook(() => useGetHomeRooms(false), { wrapper: makeWrapper() });
    await new Promise((r) => setTimeout(r, 0));
    expect(apiRequestGet).not.toHaveBeenCalled();
  });
});
