import React, { useMemo } from "react";
import useGetGameOdds from "../../../hooks/games/useGetGameOdds";
import GameCard from "./GameCard";

/**
 * Wraps GameCard with lazy, per-game odds loading for the progressive-load UI.
 *
 * The slate (GET /games/slate) gives every game without odds so cards render
 * immediately. This wrapper fetches the betting line for a single not-yet-
 * started game via GET /games/odds and merges it into the game object once it
 * arrives. Started/final games are not selectable for betting and skip the
 * odds call entirely.
 *
 * While odds are loading, `oddsLoading` is threaded to GameCard so it can show
 * a per-card "loading odds" state on the betting lines without blocking the
 * rest of the grid.
 */
const GameCardWithOdds = ({ game, sport, league, ...rest }) => {
  const isPreGame = game?.status?.state === "pre";

  // Only fetch when the game hasn't started and we don't already have a line.
  const alreadyHasOdds =
    (game?.spread !== null && game?.spread !== undefined) ||
    (game?.overUnder !== null && game?.overUnder !== undefined);

  const shouldFetchOdds = isPreGame && !alreadyHasOdds;

  const { odds, hasOdds, isOddsFetching, isOddsError, oddsRefetch } =
    useGetGameOdds({
      sport,
      league,
      gameId: game?.game_id,
      enabled: shouldFetchOdds,
    });

  // Merge fetched odds into the game object without mutating the slate item.
  const mergedGame = useMemo(() => {
    if (!odds || !hasOdds) return game;
    return {
      ...game,
      spread: odds.spread ?? game.spread,
      spreadDetails: odds.spreadDetails ?? game.spreadDetails,
      favoredTeam: odds.favoredTeam ?? game.favoredTeam,
      overUnder: odds.overUnder ?? game.overUnder,
      homeTeamOdds: odds.homeTeamOdds ?? game.homeTeamOdds,
      awayTeamOdds: odds.awayTeamOdds ?? game.awayTeamOdds,
    };
  }, [game, odds, hasOdds]);

  return (
    <GameCard
      game={mergedGame}
      sport={sport}
      league={league}
      oddsLoading={shouldFetchOdds && isOddsFetching}
      oddsError={shouldFetchOdds && isOddsError}
      onRetryOdds={oddsRefetch}
      {...rest}
    />
  );
};

export default GameCardWithOdds;
