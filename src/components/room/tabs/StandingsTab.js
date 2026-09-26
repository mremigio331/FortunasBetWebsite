import React from "react";
import RoomLeaderboard from "../RoomLeaderboard";
import RoomBetsDisplay from "../RoomBetsDisplay";

/**
 * Standings tab: room leaderboard plus the full bets display.
 */
const StandingsTab = ({
  isLeaderboardLoading,
  leaderboard,
  isRoomBetsAllLoading,
  roomId,
  roomBetsAll,
  room,
  members,
  roomBetsUsers,
  roomSport,
  removedBets,
  onRefetchBets,
}) => (
  <>
    <RoomLeaderboard
      isLoading={isLeaderboardLoading}
      leaderboard={leaderboard}
    />
    <RoomBetsDisplay
      isFetching={isRoomBetsAllLoading}
      roomId={roomId}
      existingBets={roomBetsAll}
      roomWeeks={room ? room.nfl_weeks : null}
      members={members}
      users={roomBetsUsers}
      roomSport={roomSport}
      refetchBets={onRefetchBets}
      removedBets={removedBets}
    />
  </>
);

export default StandingsTab;
