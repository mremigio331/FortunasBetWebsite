import React from "react";
import RoomLeaderboard from "../RoomLeaderboard";
import StandingsBetsLoader from "../StandingsBetsLoader";

/**
 * Standings tab: room leaderboard plus the bets display.
 *
 * Bets load progressively — StandingsBetsLoader fetches the active members
 * first, then each member's bets in parallel — so the table renders quickly
 * instead of waiting on a single room-wide bets fetch.
 */
const StandingsTab = ({
  isLeaderboardLoading,
  leaderboard,
  roomId,
  room,
  roomSport,
  removedBets,
  onRefetchBets,
}) => (
  <>
    <RoomLeaderboard
      isLoading={isLeaderboardLoading}
      leaderboard={leaderboard}
    />
    <StandingsBetsLoader
      roomId={roomId}
      room={room}
      roomSport={roomSport}
      removedBets={removedBets}
      onRefetchBets={onRefetchBets}
    />
  </>
);

export default StandingsTab;
