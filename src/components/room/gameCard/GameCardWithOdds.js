import React, { useMemo, useEffect, useRef, useState } from "react";
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

  // Flash the card when the live line actually changes (e.g. after a
  // mismatch-triggered odds invalidation re-pulls a moved line). We compare a
  // signature of the bet-relevant fields and ignore the very first value so a
  // normal initial load does not flash.
  const [oddsFlash, setOddsFlash] = useState(false);
  const prevOddsKeyRef = useRef(null);
  const flashTimerRef = useRef(null);

  const oddsKey = useMemo(() => {
    const g = mergedGame || {};
    return JSON.stringify({
      spread: g.spread ?? null,
      overUnder: g.overUnder ?? null,
      home: g.homeTeamOdds?.spreadOdds ?? null,
      away: g.awayTeamOdds?.spreadOdds ?? null,
    });
  }, [mergedGame]);

  useEffect(() => {
    if (prevOddsKeyRef.current === null) {
      prevOddsKeyRef.current = oddsKey;
      return;
    }
    if (prevOddsKeyRef.current !== oddsKey) {
      prevOddsKeyRef.current = oddsKey;
      setOddsFlash(true);
      if (flashTimerRef.current) clearTimeout(flashTimerRef.current);
      flashTimerRef.current = setTimeout(() => setOddsFlash(false), 2000);
    }
  }, [oddsKey]);

  useEffect(
    () => () => {
      if (flashTimerRef.current) clearTimeout(flashTimerRef.current);
    },
    [],
  );

  return (
    <GameCard
      game={mergedGame}
      sport={sport}
      league={league}
      oddsLoading={shouldFetchOdds && isOddsFetching}
      oddsError={shouldFetchOdds && isOddsError}
      oddsFlash={oddsFlash}
      onRetryOdds={oddsRefetch}
      {...rest}
    />
  );
};

export default GameCardWithOdds;
