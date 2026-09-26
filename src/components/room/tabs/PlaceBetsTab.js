import React from "react";
import NFLOddsSection from "../NFLOddsSection";
import MLBOddsSection from "../MLBOddsSection";

/**
 * Place Bets tab: renders the sport-specific odds/betting section.
 *
 * This is a thin dispatcher — all betting state and handlers are owned upstream
 * and passed through. MLB and NFL take slightly different prop sets, mirrored
 * here from what each section consumes.
 */
const PlaceBetsTab = ({ isMLB, mlb, nfl }) =>
  isMLB ? <MLBOddsSection {...mlb} /> : <NFLOddsSection {...nfl} />;

export default PlaceBetsTab;
