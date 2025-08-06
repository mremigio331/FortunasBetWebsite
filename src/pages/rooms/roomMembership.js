// roomMembership.js
// Contains membership-related logic for Room.js

import useGetRoomMembers from "../../hooks/membership/useGetRoomMembers";
import { useMemo } from "react";

export function useRoomMembership(roomId, currentUserId) {
  const { members, isMembersFetching } = useGetRoomMembers(roomId);

  const isMember = useMemo(() => {
    if (!currentUserId || !Array.isArray(members)) return false;
    return members.some((m) => m.user_id === currentUserId);
  }, [members, currentUserId]);

  const isMembershipFetching = isMembersFetching;

  return {
    members,
    isMember,
    isMembershipFetching,
  };
}
