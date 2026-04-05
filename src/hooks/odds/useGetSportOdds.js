import { useMemo } from "react";
import useGetNFLOdds from "./useGetNFLOdds";
import useGetMLBOdds from "./useGetMLBOdds";

/**
 * Sport-aware dispatcher hook that routes to the correct odds hook
 * based on the room's sport.
 *
 * @param {string} sport - "NFL" or "MLB"
 * @param {object} params - Sport-specific parameters:
 *   NFL: { week, year, seasonType }
 *   MLB: { date } (YYYYMMDD string)
 * @param {boolean} enabled - Whether the query should run
 * @returns Normalized odds result with a consistent interface
 */
const useGetSportOdds = (sport, params = {}, enabled = true) => {
  const isNFL = sport?.toUpperCase() !== "MLB";
  const isMLB = sport?.toUpperCase() === "MLB";

  const nflResult = useGetNFLOdds(
    params.week,
    params.year,
    params.seasonType ?? 2,
    enabled && isNFL,
  );

  const mlbResult = useGetMLBOdds(params.date, enabled && isMLB);

  const result = useMemo(() => {
    if (isMLB) {
      return {
        odds: mlbResult.mlbOdds,
        oddsCount: mlbResult.oddsCount,
        sport: mlbResult.sport || "baseball",
        league: mlbResult.league || "mlb",
        message: mlbResult.message,
        isOddsFetching: mlbResult.isOddsFetching,
        isOddsError: mlbResult.isOddsError,
        oddsStatus: mlbResult.oddsStatus,
        oddsError: mlbResult.oddsError,
        refetchOdds: mlbResult.refetchOdds,
        hasOdds: mlbResult.hasOdds,
        // Pass through sport-specific fields
        date: mlbResult.date,
        week: null,
        year: null,
        seasonType: null,
      };
    }

    return {
      odds: nflResult.nflOdds,
      oddsCount: nflResult.oddsCount,
      sport: nflResult.sport || "football",
      league: nflResult.league || "nfl",
      message: nflResult.message,
      isOddsFetching: nflResult.isOddsFetching,
      isOddsError: nflResult.isOddsError,
      oddsStatus: nflResult.oddsStatus,
      oddsError: nflResult.oddsError,
      refetchOdds: nflResult.refetchOdds,
      hasOdds: nflResult.hasOdds,
      // Pass through sport-specific fields
      date: null,
      week: nflResult.week,
      year: nflResult.year,
      seasonType: nflResult.seasonType,
    };
  }, [isMLB, nflResult, mlbResult]);

  return result;
};

export default useGetSportOdds;
