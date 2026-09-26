import React, { createContext, useContext } from "react";
import useRoomData from "../hooks/room/useRoomData";

const RoomContext = createContext(null);

/**
 * Provides all room data (record, membership, standings, odds prop bags, etc.)
 * to the room subtree via context, so deeply-nested consumers can read stable
 * values like room/roomSport/sportRules without prop drilling.
 *
 * The heavy lifting lives in useRoomData; this is just the context wrapper.
 */
export const RoomProvider = ({ roomId, children }) => {
  const value = useRoomData(roomId);
  return <RoomContext.Provider value={value}>{children}</RoomContext.Provider>;
};

/**
 * Read the room context. Must be used within a RoomProvider.
 */
export const useRoomContext = () => {
  const ctx = useContext(RoomContext);
  if (ctx === null) {
    throw new Error("useRoomContext must be used within a RoomProvider");
  }
  return ctx;
};

export default RoomProvider;
