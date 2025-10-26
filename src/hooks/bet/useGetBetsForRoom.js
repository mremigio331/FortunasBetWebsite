import { useQuery } from "@tanstack/react-query";
import { useContext, useMemo } from "react";
import { UserAuthenticationContext } from "../../provider/UserAuthenticationProvider";
import { apiRequestGet } from "../../api/apiRequest";
import { useApi } from "../../provider/ApiProvider";

const useGetBetsForRoom = (roomId, nfl_weeks, enabled = true) => {
  const { idToken } = useContext(UserAuthenticationContext);
  const { apiEndpoint, stage } = useApi();

  // Validate required parameters
  const hasRequiredParams = useMemo(
    () =>
      roomId !== undefined &&
      roomId !== null &&
      roomId !== "" &&
      nfl_weeks != null &&
      Array.isArray(nfl_weeks) &&
      nfl_weeks.length > 0,
    [roomId, nfl_weeks],
  );

  const isEnabled = useMemo(
    () => enabled && hasRequiredParams && !!idToken,
    [enabled, hasRequiredParams, idToken],
  );

  const { data, isFetching, isError, status, error, refetch, isLoading } =
    useQuery({
      queryKey: ["roomBets", roomId, nfl_weeks],
      queryFn: async () => {
        const requests = nfl_weeks.map((weekObj) => {
          const { season_type, week } = weekObj;
          const endpoint = `/bet/room/${roomId}/bets/season_type/${season_type}/week/${week}`;
          return apiRequestGet(apiEndpoint, endpoint, idToken);
        });
        const results = await Promise.all(requests);
        let allBets = [];
        let allUsers = {};
        let totalCount = 0;
        let messages = [];
        let roomIdFromApi = roomId;
        results.forEach((result) => {
          const outerData = result?.data || {};
          const data = outerData?.data || {};
          if (Array.isArray(data.bets)) {
            allBets = allBets.concat(data.bets);
          }
          if (data.users && typeof data.users === "object") {
            allUsers = { ...allUsers, ...data.users };
          }
          if (typeof data.count === "number") {
            totalCount += data.count;
          }
          if (outerData.message) {
            messages.push(outerData.message);
          }
          if (data.room_id) {
            roomIdFromApi = data.room_id;
          }
        });
        return {
          bets: allBets,
          users: allUsers,
          count: totalCount,
          room_id: roomIdFromApi,
          message: messages.length ? messages.join("; ") : null,
        };
      },
      enabled: isEnabled,
      keepPreviousData: false,
      staleTime: 1000 * 60 * 2,
      cacheTime: 1000 * 60 * 10,
      retry: 3,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      refetchOnWindowFocus: true,
      refetchInterval: 1000 * 60 * 5,
    });

  // Memoize the return values
  const returnValues = useMemo(() => {
    const apiData = data || {};
    const bets = apiData.bets || [];
    const users = apiData.users || {};
    const betsCount = apiData.count || 0;
    const hasBets = bets.length > 0;
    const isBetsFetching = isFetching;
    const isBetsLoading = isLoading;
    const isBetsRefetching = isFetching && !isLoading;
    return {
      bets,
      users,
      betsCount,
      roomId: apiData.room_id || roomId,
      message: apiData.message || data?.message || null,
      isBetsFetching,
      isBetsLoading,
      isBetsRefetching,
      isBetsError: isError,
      betsStatus: status,
      betsError: error,
      betsRefetch: refetch,
      refetchBets: () => refetch(),
      hasBets,
      getBetsByUser: (userId) => bets.filter((bet) => bet.user_id === userId),
      getCurrentUserBets: (currentUserId) => {
        if (!currentUserId) return [];
        return bets.filter((bet) => bet.user_id === currentUserId);
      },
      getOtherUsersBets: (currentUserId) => {
        if (!currentUserId) return [];
        return bets.filter((bet) => bet.user_id !== currentUserId);
      },
      getBetsByPoints: (points) =>
        bets.filter((bet) => bet.points_wagered === points),
    };
  }, [data, roomId, isFetching, isError, status, error, refetch, isEnabled]);

  return returnValues;
};

export default useGetBetsForRoom;
