import { useQuery } from "@tanstack/react-query";
import { useContext, useMemo } from "react";
import { UserAuthenticationContext } from "../../provider/UserAuthenticationProvider";
import { apiRequestGet } from "../../api/apiRequest";
import { useApi } from "../../provider/ApiProvider";

/**
 * Lazily loads betting odds for a single game via GET /games/odds.
 *
 * Intended to be called per not-yet-started game after the slate has rendered,
 * so each game card can show a loading state on its line while the odds fetch
 * resolves. Pass enabled=false for games that have already started (no odds
 * needed) to avoid unnecessary requests.
 */
const useGetGameOdds = ({ sport, league, gameId, enabled = true }) => {
  const { idToken } = useContext(UserAuthenticationContext);
  const { apiEndpoint } = useApi();

  const hasRequiredParams = useMemo(
    () => Boolean(sport && league && gameId),
    [sport, league, gameId],
  );

  const isEnabled = useMemo(
    () => enabled && hasRequiredParams,
    [enabled, hasRequiredParams],
  );

  const queryParams = useMemo(() => {
    const params = new URLSearchParams();
    if (sport) params.append("sport", sport);
    if (league) params.append("league", league);
    if (gameId) params.append("game_id", gameId.toString());
    return params.toString();
  }, [sport, league, gameId]);

  const { data, isFetching, isError, status, error, refetch } = useQuery({
    queryKey: ["gameOdds", sport, league, gameId],
    queryFn: () => {
      return apiRequestGet(apiEndpoint, `/games/odds?${queryParams}`, idToken);
    },
    enabled: isEnabled,
    keepPreviousData: false,
    staleTime: 1000 * 60 * 2,
    cacheTime: 1000 * 60 * 10,
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    refetchOnWindowFocus: true,
  });

  return {
    odds: data ? data.data.odds : null,
    gameId: data ? data.data.game_id : gameId,
    hasOdds: data ? Boolean(data.data.hasOdds) : false,
    message: data ? data.data.message : null,
    isOddsFetching: isFetching,
    isOddsError: isError,
    oddsStatus: status,
    oddsError: error,
    oddsRefetch: refetch,
  };
};

export default useGetGameOdds;
