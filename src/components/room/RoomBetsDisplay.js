import React, { useMemo, useContext, useState, useCallback } from "react";
import useIsMobile from "../../hooks/useIsMobile";
import {
  Card,
  Row,
  Col,
  Typography,
  Tag,
  Space,
  Avatar,
  Divider,
  Empty,
  Button,
  Modal,
  Collapse,
} from "antd";
import RoomBetsTable from "./RoomBetsTable";
import RoomBetsCards from "./RoomBetsCards";
import RoomChart from "./RoomChart";
import BetCard from "./BetCard";
import EditBetModal from "./EditBetModal";
import {
  TrophyOutlined,
  UserOutlined,
  DownOutlined,
  RightOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
import { UserAuthenticationContext } from "../../provider/UserAuthenticationProvider";
import computeDisplayedSpread from "../../utils/spreadUtils";
import { getAvatarStyle } from "../../utils/avatarStyles";
import { computeUserStats } from "../../utils/betUtils";
import LoadingSpinner from "../shared/LoadingSpinner";
import useUpdateBet from "../../hooks/bet/useUpdateBet";
import useRemoveBet from "../../hooks/bet/useRemoveBet";
import { getSportBettingRules } from "../../configs/sportConfig";

const { Title, Text } = Typography;

const RoomBetsDisplay = ({
  isFetching,
  roomId,
  roomWeeks,
  existingBets: existingBetsProp,
  members: membersProp,
  users: usersProp,
  roomSport,
  refetchBets,
  removedBets: removedBetsProp,
}) => {
  if (isFetching) {
    return (
      <Card
        title={
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Space>
              <TrophyOutlined />
              <span>Room Bets</span>
            </Space>
          </div>
        }
        style={{ marginBottom: "24px" }}
      >
        <LoadingSpinner message="Loading bets..." />
      </Card>
    );
  }

  const isMobile = useIsMobile();
  const { user } = useContext(UserAuthenticationContext);
  const [expandedUsers, setExpandedUsers] = useState({});
  const [editingBet, setEditingBet] = useState(null);
  const { updateBet, isLoading: isUpdateLoading } = useUpdateBet();
  const { removeBet, isLoading: isRemoveLoading } = useRemoveBet();
  const sportRules = useMemo(
    () => getSportBettingRules(roomSport || "NFL"),
    [roomSport],
  );

  const handleEditBet = useCallback((bet) => {
    setEditingBet(bet);
  }, []);

  const handleEditSubmit = useCallback(
    async (betData) => {
      try {
        await updateBet(betData);
        setEditingBet(null);
        if (refetchBets) refetchBets();
      } catch {
        // error is handled by the hook
      }
    },
    [updateBet, refetchBets],
  );

  const handleRemoveBet = useCallback(
    (bet) => {
      const teams = bet.odds_snapshot?.teams;
      const matchup = teams
        ? `${teams.away?.name || "Away"} @ ${teams.home?.name || "Home"}`
        : "this game";

      Modal.confirm({
        title: "Remove Bet",
        content: `Are you sure you want to remove your ${bet.points_wagered || ""}pt bet on ${matchup}? This will free up the bet slot for this week.`,
        okText: "Remove",
        okType: "danger",
        cancelText: "Cancel",
        onOk: async () => {
          try {
            await removeBet({
              room_id: bet.room_id || roomId,
              game_id: bet.game_id,
              sport: bet.sport || "football",
              league: bet.league || "nfl",
            });
            if (refetchBets) refetchBets();
          } catch {
            // error is handled by the hook
          }
        },
      });
    },
    [removeBet, refetchBets, roomId],
  );

  const betsSource = existingBetsProp || [];
  const usersList = usersProp || membersProp || [];
  const users = Array.isArray(usersList)
    ? Object.fromEntries(usersList.map((u) => [u.user_id, u]))
    : usersList;
  const betsCount = betsSource.length;
  const hasBets = betsCount > 0;
  const getCurrentUserBets = (userId) => {
    if (!userId) return [];
    return betsSource.filter((bet) => bet.user_id === userId);
  };
  const getOtherUsersBets = (userId) => {
    if (!userId) return [];
    return betsSource.filter((bet) => bet.user_id !== userId);
  };

  // Calculate user statistics
  const userStats = useMemo(() => {
    return computeUserStats(betsSource, users);
  }, [betsSource, users]);

  const currentUserBets = useMemo(() => {
    return getCurrentUserBets(user?.user_id);
  }, [getCurrentUserBets, user?.user_id]);

  const otherUsersBets = useMemo(() => {
    return getOtherUsersBets(user?.user_id);
  }, [getOtherUsersBets, user?.user_id]);

  // Table columns for user statistics
  const userStatsColumns = [
    {
      title: "User",
      dataIndex: "user_name",
      key: "user_name",
      render: (text, record) => (
        <Space>
          <Avatar
            icon={<UserOutlined />}
            size="small"
            style={getAvatarStyle(record.user_color)}
          />
          <Text
            strong={record.user_id === user?.user_id}
            style={{ wordBreak: "break-word" }} // Ensure long names wrap to a new line
          >
            {record.user_id === user?.user_id ? "You" : text}
          </Text>
          {record.user_id === user?.user_id && (
            <Tag color="green" size="small">
              Your Stats
            </Tag>
          )}
        </Space>
      ),
    },
    {
      title: "Total Bets",
      dataIndex: "total_bets",
      key: "total_bets",
      align: "center",
      sorter: (a, b) => a.total_bets - b.total_bets,
    },
    {
      title: "Bets Won",
      dataIndex: "bets_won",
      key: "bets_won",
      align: "center",
      sorter: (a, b) => a.bets_won - b.bets_won,
      render: (value, record) => (
        <Text>
          {value} / {record.total_bets}
          {record.total_bets > 0 && (
            <Text
              type="secondary"
              style={{ fontSize: "12px", marginLeft: "4px" }}
            >
              ({Math.round((value / record.total_bets) * 100)}%)
            </Text>
          )}
        </Text>
      ),
    },
    {
      title: "Points Awarded",
      dataIndex: "points_total",
      key: "points_total",
      align: "center",
      sorter: (a, b) => a.points_total - b.points_total,
      render: (value) => (
        <Text strong style={{ color: "#faad14", fontSize: "16px" }}>
          {value}
        </Text>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      align: "center",
      render: (text, record) => (
        <Button
          size="small"
          type="link"
          icon={
            expandedUsers[record.user_id] ? <DownOutlined /> : <RightOutlined />
          }
          onClick={() => toggleUserExpansion(record.user_id)}
        >
          {expandedUsers[record.user_id] ? "Hide" : "View"} Bets
        </Button>
      ),
    },
  ];

  // Toggle user bet expansion
  const toggleUserExpansion = (userId) => {
    setExpandedUsers((prev) => ({
      ...prev,
      [userId]: !prev[userId],
    }));
  };

  const totalPointsWagered = useMemo(() => {
    return betsSource.reduce(
      (total, bet) => total + (bet.points_wagered || 0),
      0,
    );
  }, [betsSource]);

  // No loading/error UI since data comes from parent

  return (
    <>
      <Card
        title={
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Space>
              <TrophyOutlined />
              <span>Room Bets</span>
              <Tag color="blue">{betsCount} total</Tag>
            </Space>
          </div>
        }
        style={{ marginBottom: "24px" }}
      >
        {!hasBets ? (
          <Empty
            description="No bets placed yet"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            style={{ padding: "20px 0" }}
          >
            <Text type="secondary">
              Be the first to place a bet on the games below!
            </Text>
          </Empty>
        ) : (
          <>
            {/* Room Chart (aggregated points per user by week) */}
            <RoomChart
              existingBets={betsSource}
              members={membersProp}
              width={Math.min(window.innerWidth - 80, 1000)}
            />

            {/* Bet History Section - Responsive Table for Desktop, Table for Bets on Mobile */}
            <div style={{ marginBottom: "24px" }}>
              <Title level={4} style={{ marginBottom: "16px" }}>
                <TrophyOutlined
                  style={{ color: "#faad14", marginRight: "8px" }}
                />
                Bet History
              </Title>
              <div className="bet-history-responsive">
                {isMobile ? (
                  <RoomBetsCards
                    userStats={userStats}
                    getAvatarStyle={getAvatarStyle}
                    user={user}
                    BetCardComponent={BetCard}
                    onEditBet={handleEditBet}
                    onRemoveBet={handleRemoveBet}
                  />
                ) : (
                  <RoomBetsTable
                    userStats={userStats}
                    userStatsColumns={userStatsColumns}
                    expandedUsers={expandedUsers}
                    toggleUserExpansion={toggleUserExpansion}
                    getAvatarStyle={getAvatarStyle}
                    user={user}
                    BetCardComponent={BetCard}
                    onEditBet={handleEditBet}
                    onRemoveBet={handleRemoveBet}
                  />
                )}
              </div>
            </div>

            {/* Current User's Bets */}
            {currentUserBets.length > 0 && (
              <>
                <Divider orientation="left">
                  <Space>
                    <UserOutlined style={{ color: "#52c41a" }} />
                    <span>Your Bets ({currentUserBets.length})</span>
                  </Space>
                </Divider>
                {currentUserBets.map((bet) => (
                  <BetCard
                    key={`${bet.user_id}-${bet.game_id}-${bet.points_wagered}`}
                    bet={bet}
                    isCurrentUser={true}
                    isMobile={isMobile}
                    onEditBet={handleEditBet}
                    onRemoveBet={handleRemoveBet}
                  />
                ))}
              </>
            )}

            {/* Other Users' Bets */}
            {otherUsersBets.length > 0 && (
              <>
                <Divider orientation="left">
                  <Space>
                    <UserOutlined style={{ color: "#1890ff" }} />
                    <span>Other Players ({otherUsersBets.length})</span>
                  </Space>
                </Divider>
                {otherUsersBets.map((bet) => (
                  <BetCard
                    key={`${bet.user_id}-${bet.game_id}-${bet.points_wagered}`}
                    bet={bet}
                    isCurrentUser={false}
                    isMobile={isMobile}
                  />
                ))}
              </>
            )}

            {/* Removed Bets History */}
            {removedBetsProp && removedBetsProp.length > 0 && (
              <>
                <Divider orientation="left">
                  <Space>
                    <DeleteOutlined style={{ color: "#8c8c8c" }} />
                    <span>Removed Bets ({removedBetsProp.length})</span>
                  </Space>
                </Divider>
                <Collapse
                  ghost
                  items={[
                    {
                      key: "removed",
                      label: (
                        <Text type="secondary" style={{ fontSize: "13px" }}>
                          Show {removedBetsProp.length} removed bet
                          {removedBetsProp.length !== 1 ? "s" : ""}
                        </Text>
                      ),
                      children: removedBetsProp.map((bet) => (
                        <BetCard
                          key={`removed-${bet.SK || bet.game_id}-${bet.points_wagered}`}
                          bet={bet}
                          isCurrentUser={true}
                          isMobile={isMobile}
                        />
                      )),
                    },
                  ]}
                />
              </>
            )}
          </>
        )}
      </Card>

      {editingBet && (
        <EditBetModal
          visible={!!editingBet}
          onCancel={() => setEditingBet(null)}
          onSubmit={handleEditSubmit}
          bet={editingBet}
          sportRules={sportRules}
          isLoading={isUpdateLoading}
        />
      )}
    </>
  );
};

export default RoomBetsDisplay;
