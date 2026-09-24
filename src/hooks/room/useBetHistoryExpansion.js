import { useCallback, useState } from "react";

/**
 * Shared expansion state for the room bet-history views (desktop table and
 * mobile cards). Both views show a per-user section that can be expanded, and
 * within each user a set of per-week groups that can be expanded independently.
 *
 * State is always scoped by user id so that expanding a week for one user does
 * NOT expand the same week for every other user. Keeping this logic in one hook
 * prevents the two views from drifting apart (which previously caused a bug
 * where a single week toggle expanded that week for everyone in the table).
 *
 * State shapes:
 *   expandedUsers: { [userId]: boolean }
 *   expandedWeeks: { [userId]: { [week]: boolean } }
 *
 * @returns {{
 *   expandedUsers: Object,
 *   toggleUser: (userId: string) => void,
 *   isUserExpanded: (userId: string) => boolean,
 *   toggleWeek: (userId: string, week: string|number) => void,
 *   isWeekExpanded: (userId: string, week: string|number) => boolean,
 * }}
 */
const useBetHistoryExpansion = () => {
  const [expandedUsers, setExpandedUsers] = useState({});
  const [expandedWeeks, setExpandedWeeks] = useState({});

  const toggleUser = useCallback((userId) => {
    setExpandedUsers((prev) => ({
      ...prev,
      [userId]: !prev[userId],
    }));
  }, []);

  const isUserExpanded = useCallback(
    (userId) => !!expandedUsers[userId],
    [expandedUsers],
  );

  const toggleWeek = useCallback((userId, week) => {
    setExpandedWeeks((prev) => ({
      ...prev,
      [userId]: {
        ...(prev[userId] || {}),
        [week]: !(prev[userId] || {})[week],
      },
    }));
  }, []);

  const isWeekExpanded = useCallback(
    (userId, week) => !!(expandedWeeks[userId] || {})[week],
    [expandedWeeks],
  );

  return {
    expandedUsers,
    toggleUser,
    isUserExpanded,
    toggleWeek,
    isWeekExpanded,
  };
};

export default useBetHistoryExpansion;
