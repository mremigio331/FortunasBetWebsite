import { useMemo } from "react";
import useGetGameSlate from "./useGetGameSlate";

/**
 * Sport-aware slate loader for the progressive-load betting UI.
 *
 * Loads ALL games for the slate up front from GET /games/slate (one fast
 * scoreboard call) so the page can render every game card immediately. Betting
 * odds are then fetched lazily, per not-yet-started game, inside each card via
 * useGetGameOdds — so a slow odds call for one game never blocks the rest of
 * the grid.
 *
 * Returns the same shape the room consumes for the old bulk odds hooks
 * (odds/oddsCount/hasOdds/isOddsFetching/...), where `odds` is now the slate of
 * games with null odds placeholders that fill in as each card resolves.
 *
 * @param {string} sport - "NFL"/"football" or "MLB"/"baseball"
 * @param {object} params - NFL: { week, year, seasonType }; MLB: { date }
 * @param {boolean} enabled
 */
const useGetSlateWithOdds = (sport, params = {}, enabled = true) => {
  const isMLB = sport?.toUpperCase() === "MLB" || sport === "baseball";
  const league = isMLB ? "mlb" : "nfl";
  const espnSport = isMLB ? "baseball" : "football";

  const {
    games,
    gamesCount,
    isSlateFetching,
    isSlatePending,
    isSlateError,
    slateStatus,
    slateError,
    slateRefetch,
    hasGames,
    message,
  } = useGetGameSlate({
    sport: espnSport,
    league,
    week: params.week,
    year: params.year,
    seasonType: params.seasonType ?? 2,
    date: params.date,
    enabled,
  });

  return useMemo(
    () => ({
      // Same interface as the legacy odds hooks so Room.js can consume it.
      odds: games,
      // Alias kept so existing NFL consumers destructuring `nflOdds` work.
      nflOdds: games,
      oddsCount: gamesCount,
      sport: espnSport,
      league,
      message,
      isOddsFetching: isSlateFetching || isSlatePending,
      isOddsError: isSlateError,
      oddsStatus: slateStatus,
      oddsError: slateError,
      refetchOdds: slateRefetch,
      oddsRefetch: slateRefetch,
      hasOdds: hasGames,
      // Sport-specific passthrough
      date: isMLB ? params.date : null,
      week: isMLB ? null : params.week,
      year: isMLB ? null : params.year,
      seasonType: isMLB ? null : (params.seasonType ?? 2),
    }),
    [
      games,
      gamesCount,
      espnSport,
      league,
      message,
      isSlateFetching,
      isSlatePending,
      isSlateError,
      slateStatus,
      slateError,
      slateRefetch,
      hasGames,
      isMLB,
      params.date,
      params.week,
      params.year,
      params.seasonType,
    ],
  );
};

export default useGetSlateWithOdds;
