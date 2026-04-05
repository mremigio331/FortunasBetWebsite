import { useQuery } from "@tanstack/react-query";
import { useContext, useMemo } from "react";
import { UserAuthenticationContext } from "../../provider/UserAuthenticationProvider";
import { apiRequestGet } from "../../api/apiRequest";
import { useApi } from "../../provider/ApiProvider";

/**
 * Generate YYYYMMDD date strings for each day in an epoch range.
 */
const getDatesInRange = (weekStart, weekEnd) => {
  if (!weekStart || !weekEnd) return [];
  const dates = [];
  const current = new Date(weekStart * 1000);
  const end = new Date(weekEnd * 1000);
  while (current <= end) {
    const yyyy = current.getFullYear();
    const mm = String(current.getMonth() + 1).padStart(2, "0");
    const dd = String(current.getDate()).padStart(2, "0");
    dates.push(`${yyyy}${mm}${dd}`);
    current.setDate(current.getDate() + 1);
  }
  return dates;
};

/**
 * Format a YYYYMMDD string into a display label like "Mon, Jul 7"
 */
const formatDateLabel = (dateStr) => {
  const y = parseInt(dateStr.slice(0, 4), 10);
  const m = parseInt(dateStr.slice(4, 6), 10) - 1;
  const d = parseInt(dateStr.slice(6, 8), 10);
  const dt = new Date(y, m, d);
  return dt.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
};

/**
 * Fetch MLB odds for a week range by making parallel per-day API calls.
 *
 * Returns:
 *  - allOdds: flat array of all games across the week
 *  - oddsByDay: array of { date, label, games[] } sorted chronologically
 */
const useGetMLBOdds = (weekStart, weekEnd, enabled = true) => {
  const { idToken } = useContext(UserAuthenticationContext);
  const { apiEndpoint } = useApi();

  const dates = useMemo(
    () => getDatesInRange(weekStart, weekEnd),
    [weekStart, weekEnd],
  );

  const isEnabled = useMemo(
    () => enabled && dates.length > 0 && !!idToken,
    [enabled, dates, idToken],
  );

  const { data, isFetching, isError, status, error, refetch } = useQuery({
    queryKey: ["mlbOdds", weekStart, weekEnd],
    queryFn: async () => {
      const results = await Promise.all(
        dates.map(async (date) => {
          try {
            const res = await apiRequestGet(
              apiEndpoint,
              `/odds/get_mlb_odds?date=${date}`,
              idToken,
            );
            return { date, games: res.data?.odds || [] };
          } catch {
            return { date, games: [] };
          }
        }),
      );
      return results;
    },
    enabled: isEnabled,
    keepPreviousData: false,
    staleTime: 1000 * 60 * 5,
    cacheTime: 1000 * 60 * 15,
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 15000),
    refetchOnWindowFocus: true,
  });

  const oddsByDay = useMemo(() => {
    if (!data) return [];
    return data.map((d) => ({
      date: d.date,
      label: formatDateLabel(d.date),
      games: d.games,
    }));
  }, [data]);

  const allOdds = useMemo(() => {
    if (!oddsByDay) return [];
    return oddsByDay.flatMap((d) => d.games);
  }, [oddsByDay]);

  return {
    mlbOdds: allOdds,
    oddsByDay,
    oddsCount: allOdds.length,
    isOddsFetching: isFetching,
    isOddsError: isError,
    oddsStatus: status,
    oddsError: error,
    oddsRefetch: refetch,
    hasOdds: allOdds.length > 0,
  };
};

export default useGetMLBOdds;
