import { useQuery } from "@tanstack/react-query";
import { useContext, useMemo } from "react";
import { UserAuthenticationContext } from "../../provider/UserAuthenticationProvider";
import { apiRequestGet } from "../../api/apiRequest";
import { useApi } from "../../provider/ApiProvider";

/**
 * Loads all games for a slate WITHOUT odds via GET /games/slate.
 *
 * This is the fast first paint: it renders the games list immediately from a
 * single ESPN scoreboard call. Betting lines are then loaded lazily per
 * not-yet-started game with useGetGameOdds.
 *
 * NFL: pass sport="football", league="nfl", week, year, seasonType.
 * MLB: pass sport="baseball", league="mlb", date (YYYYMMDD).
 */
const useGetGameSlate = ({
  sport,
  league,
  week,
  year,
  seasonType = 2,
  date,
  enabled = true,
}) => {
  const { idToken } = useContext(UserAuthenticationContext);
  const { apiEndpoint } = useApi();

  const isMLB = (league || "").toLowerCase() === "mlb";

  const hasRequiredParams = useMemo(() => {
    if (!sport || !league) return false;
    if (isMLB) return Boolean(date);
    return (
      week !== undefined && week !== null && year !== undefined && year !== null
    );
  }, [sport, league, isMLB, week, year, date]);

  const isEnabled = useMemo(
    () => enabled && hasRequiredParams,
    [enabled, hasRequiredParams],
  );

  const queryParams = useMemo(() => {
    const params = new URLSearchParams();
    if (sport) params.append("sport", sport);
    if (league) params.append("league", league);
    if (isMLB) {
      if (date) params.append("date", date);
    } else {
      if (week !== undefined && week !== null)
        params.append("week", week.toString());
      if (year !== undefined && year !== null)
        params.append("year", year.toString());
      if (seasonType !== undefined && seasonType !== null)
        params.append("season_type", seasonType.toString());
    }
    return params.toString();
  }, [sport, league, isMLB, week, year, seasonType, date]);

  const { data, isFetching, isError, status, error, refetch } = useQuery({
    queryKey: ["gameSlate", sport, league, week, year, seasonType, date],
    queryFn: () => {
      return apiRequestGet(apiEndpoint, `/games/slate?${queryParams}`, idToken);
    },
    enabled: isEnabled,
    keepPreviousData: false,
    staleTime: 1000 * 60 * 5,
    cacheTime: 1000 * 60 * 15,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    refetchOnWindowFocus: true,
  });

  return {
    games: data ? data.data.games : [],
    gamesCount: data ? data.data.count : 0,
    sport: data ? data.data.sport : sport,
    league: data ? data.data.league : league,
    week: data ? data.data.week : week,
    year: data ? data.data.year : year,
    seasonType: data ? data.data.season_type : seasonType,
    date: data ? data.data.date : date,
    message: data ? data.data.message : null,
    isSlateFetching: isFetching,
    isSlateError: isError,
    slateStatus: status,
    slateError: error,
    slateRefetch: refetch,
    hasGames: data ? data.data.games.length > 0 : false,
  };
};

export default useGetGameSlate;
