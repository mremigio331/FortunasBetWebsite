import React, { useEffect, useMemo, useState, useCallback } from "react";
import { Alert, Card, Progress, Space, Typography } from "antd";
import { TeamOutlined, TrophyOutlined } from "@ant-design/icons";
import LoadingSpinner from "../shared/LoadingSpinner";
import useGetStandingsMembers from "../../hooks/room/useGetStandingsMembers";
import useGetUserRoomBets from "../../hooks/room/useGetUserRoomBets";
import RoomBetsDisplay from "./RoomBetsDisplay";

const { Text } = Typography;

/**
 * Loads standings bets progressively: first the active members (fast), then
 * each member's bets in parallel via a per-member loader. Assembles the flat
 * bet array + user map that RoomBetsDisplay already expects, so that component
 * stays unchanged.
 *
 * Rather than block the whole display until every user resolves, this surfaces
 * progress: once members are found it shows "Found X players, loading bets
 * N/X" and streams each user's bets in as they arrive.
 */

/**
 * Invisible per-member fetcher. Owns one useGetUserRoomBets call and reports
 * its result up via onLoaded. Rendering one of these per member is what gives
 * us N parallel, independent requests.
 */
const MemberBetsFetcher = ({ roomId, userId, onLoaded }) => {
  const { bets, isLoading } = useGetUserRoomBets(roomId, userId, true);

  useEffect(() => {
    onLoaded(userId, { bets, isLoading });
  }, [userId, bets, isLoading, onLoaded]);

  return null;
};

const StandingsBetsLoader = ({
  roomId,
  room,
  roomSport,
  removedBets,
  onRefetchBets,
}) => {
  const { members, isLoading: isMembersLoading } =
    useGetStandingsMembers(roomId);

  // Per-user results keyed by userId: { bets, isLoading }.
  const [byUser, setByUser] = useState({});

  const handleLoaded = useCallback((userId, result) => {
    setByUser((prev) => {
      const existing = prev[userId];
      if (
        existing &&
        existing.isLoading === result.isLoading &&
        existing.bets === result.bets
      ) {
        return prev;
      }
      return { ...prev, [userId]: result };
    });
  }, []);

  // Flatten all loaded users' bets into the single array RoomBetsDisplay wants.
  const existingBets = useMemo(() => {
    return members.flatMap((m) => byUser[m.user_id]?.bets || []);
  }, [members, byUser]);

  const loadedCount = useMemo(
    () => members.filter((m) => byUser[m.user_id]?.isLoading === false).length,
    [members, byUser],
  );

  const totalMembers = members.length;
  const allBetsLoaded = totalMembers > 0 && loadedCount === totalMembers;

  // Block only on the (fast) members fetch. Once members are known, render the
  // display and let each user's bets stream in.
  if (isMembersLoading) {
    return (
      <Card
        title={
          <Space>
            <TrophyOutlined />
            <span>Room Bets</span>
          </Space>
        }
        style={{ marginBottom: "24px" }}
      >
        <LoadingSpinner message="Finding players…" />
      </Card>
    );
  }

  return (
    <>
      {members.map((m) => (
        <MemberBetsFetcher
          key={m.user_id}
          roomId={roomId}
          userId={m.user_id}
          onLoaded={handleLoaded}
        />
      ))}

      <RoomBetsDisplay
        isFetching={false}
        roomId={roomId}
        existingBets={existingBets}
        roomWeeks={room ? room.nfl_weeks : null}
        members={members}
        users={members}
        roomSport={roomSport}
        refetchBets={onRefetchBets}
        removedBets={removedBets}
        loadingBanner={
          totalMembers > 0 && !allBetsLoaded ? (
            <Alert
              type="info"
              showIcon
              icon={<TeamOutlined />}
              style={{ marginBottom: 16 }}
              message={
                <Space direction="vertical" style={{ width: "100%" }} size={4}>
                  <Text>
                    Found {totalMembers} player
                    {totalMembers !== 1 ? "s" : ""} — loading their bets (
                    {loadedCount}/{totalMembers})
                  </Text>
                  <Progress
                    percent={Math.round((loadedCount / totalMembers) * 100)}
                    size="small"
                    status="active"
                    showInfo={false}
                  />
                </Space>
              }
            />
          ) : null
        }
      />
    </>
  );
};

export default StandingsBetsLoader;
