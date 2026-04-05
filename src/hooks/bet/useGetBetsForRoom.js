import { useQuery } from "@tanstack/react-query";
import { useContext, useMemo } from "react";
import { UserAuthenticationContext } from "../../provider/UserAuthenticationProvider";
import { apiRequestGet } from "../../api/apiRequest";
import { useApi } from "../../provider/ApiProvider";

/**
 * Fetch all bets for a room across its weeks.
 *
 * Supports two modes:
 *  - NFL: pass nfl_weeks (array of {season_type, week})
 *  - MLB: pass mlb_weeks (array of {start, end} epoch timestamps)
 *
 * At least one of nfl_weeks or mlb_weeks must be a non-empty array.
 */
const useGetBetsForRoom = (
  roomId,
  nfl_weeks,
  enabled = true,
  mlb_weeks = null,
) => {
  const { idToken } = useContext(UserAuthenticationContext);
  const { apiEndpoint } = useApi();

  const hasNFL = useMemo(
    () => Array.isArray(nfl_weeks) && nfl_weeks.length > 0,
    [nfl_weeks],
  );
  const hasMLB = useMemo(
    () => Array.isArray(mlb_weeks) && mlb_weeks.length > 0,
    [mlb_weeks],
  );

  const hasRequiredParams = useMemo(
    () => roomId != null && roomId !== "" && (hasNFL || hasMLB),
    [roomId, hasNFL, hasMLB],
  );

  const isEnabled = useMemo(
    () => enabled && hasRequiredParams && !!idToken,
    [enabled, hasRequiredParams, idToken],
  );

  // Stable cache key
  const weeksKey = useMemo(
    () => (hasNFL ? nfl_weeks : mlb_weeks),
    [hasNFL, nfl_weeks, mlb_weeks],
  );

  const { data, isFetching, isError, status, error, refetch, isLoading } =
    useQuery({
      queryKey: ["roomBets", roomId, weeksKey],
      queryFn: async () => {
        let requests;

        if (hasNFL) {
          requests = nfl_weeks.map((weekObj) => {
            const { season_type, week } = weekObj;
            const endpoint = `/bet/room/${roomId}/bets/season_type/${season_type}/week/${week}`;
            return apiRequestGet(apiEndpoint, endpoint, idToken);
          });
        } else {
          requests = mlb_weeks.map((weekObj) => {
            const endpoint = `/bet/room/${roomId}/bets/week_start/${weekObj.start}/week_end/${weekObj.end}`;
            return apiRequestGet(apiEndpoint, endpoint, idToken);
          });
        }

        const results = await Promise.all(requests);
        let allBets = [];
        let allUsers = {};
        let totalCount = 0;
        let messages = [];
        let roomIdFromApi = roomId;
        results.forEach((result) => {
          const outerData = result?.data || {};
          const d = outerData?.data || {};
          if (Array.isArray(d.bets)) {
            allBets = allBets.concat(d.bets);
          }
          if (d.users && typeof d.users === "object") {
            allUsers = { ...allUsers, ...d.users };
          }
          if (typeof d.count === "number") {
            totalCount += d.count;
          }
          if (outerData.message) {
            messages.push(outerData.message);
          }
          if (d.room_id) {
            roomIdFromApi = d.room_id;
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

  const returnValues = useMemo(() => {
    const apiData = data || {};
    const bets = apiData.bets || [];
    const users = apiData.users || {};
    const betsCount = apiData.count || 0;
    const hasBets = bets.length > 0;
    return {
      bets,
      users,
      betsCount,
      roomId: apiData.room_id || roomId,
      message: apiData.message || data?.message || null,
      isBetsFetching: isFetching,
      isBetsLoading: isLoading,
      isBetsRefetching: isFetching && !isLoading,
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
