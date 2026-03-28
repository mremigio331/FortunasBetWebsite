import React, { useMemo, useContext, useState } from "react";
import {
  Card,
  Row,
  Col,
  Typography,
  Spin,
  Alert,
  Tag,
  Space,
  Avatar,
  Divider,
  Empty,
  Button,
  Tooltip,
} from "antd";
import RoomBetsTable from "./RoomBetsTable";
import RoomBetsCards from "./RoomBetsCards";
import RoomChart from "./RoomChart";
import ScoreDisplay from "./ScoreDisplay";
import {
  TrophyOutlined,
  UserOutlined,
  EyeOutlined,
  EyeInvisibleOutlined,
  ReloadOutlined,
  DownOutlined,
  RightOutlined,
  LinkOutlined,
} from "@ant-design/icons";
import { UserAuthenticationContext } from "../../provider/UserAuthenticationProvider";
import useGetBetsForRoom from "../../hooks/bet/useGetBetsForRoom";
import computeDisplayedSpread from "../../utils/spreadUtils";
import { getAvatarStyle } from "../../utils/avatarStyles";
import { truncateName } from "../../utils/textUtils";

const { Title, Text } = Typography;

// Responsive hook
const useIsMobile = () => {
  const [isMobile, setIsMobile] = React.useState(false);
  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);
  return isMobile;
};

const RoomBetsDisplay = ({
  isFetching,
  roomId,
  roomWeeks,
  existingBets: existingBetsProp,
  members: membersProp,
  users: usersProp,
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
        <div style={{ textAlign: "center", padding: "40px" }}>
          <Spin size="large" />
          <div style={{ marginTop: "16px" }}>
            <Typography.Text>Loading bets...</Typography.Text>
          </div>
        </div>
      </Card>
    );
  }

  const isMobile = useIsMobile();
  const { user } = useContext(UserAuthenticationContext);
  const [expandedUsers, setExpandedUsers] = useState({});

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
    if (!betsSource || !Array.isArray(betsSource) || !users) return [];

    const statsMap = {};

    betsSource.forEach((bet) => {
      const userId = bet.user_id;
      const userProfile = users[userId] || {};
      let userName =
        userProfile.user_name ||
        userProfile.name ||
        `User ${userId?.slice(-4) || "****"}`;
      if (userName.length > 20) {
        userName = truncateName(userName);
      }
      const userColor = userProfile.user_color || "black";

      if (!statsMap[userId]) {
        statsMap[userId] = {
          user_id: userId,
          user_name: userName,
          user_color: userColor,
          total_bets: 0,
          bets_won: 0,
          points_total: 0,
          bets: [],
        };
      }

      statsMap[userId].total_bets += 1;

      // Use total_points_earned for points awarded (only add if positive)
      if (bet.total_points_earned && bet.total_points_earned > 0) {
        statsMap[userId].points_total += bet.total_points_earned;
      }

      // Check if bet was won (only if game_bet has result)
      if (bet.game_bet?.result === "win") {
        statsMap[userId].bets_won += 1;
      }

      // Add bet to user's bets array
      statsMap[userId].bets.push(bet);
    });

    Object.values(statsMap).forEach((userStat) => {
      userStat.bets.sort(
        (a, b) => (b.event_datetime || 0) - (a.event_datetime || 0),
      );
    });
    return Object.values(statsMap).sort(
      (a, b) => b.points_total - a.points_total,
    );
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

  const renderBetCard = (bet, isCurrentUser = false) => {
    const isPrivate = !bet.game_bet && !isCurrentUser;

    // Format date
    const betDate = bet.event_datetime
      ? new Date(bet.event_datetime * 1000).toLocaleDateString()
      : "Unknown";

    // Get teams from odds_snapshot
    let homeTeam = "Home Team";
    let awayTeam = "Away Team";

    if (bet.odds_snapshot?.teams) {
      const { home, away } = bet.odds_snapshot.teams;
      if (home?.name) homeTeam = home.name;
      if (away?.name) awayTeam = away.name;
    }

    // Get spread and total values from odds_snapshot if not in game_bet
    const spreadValue = bet.game_bet?.spread_value || bet.odds_snapshot?.spread;
    const totalValue =
      bet.game_bet?.total_value || bet.odds_snapshot?.overUnder;

    // Determine bet status colors and info
    const getBetStatusInfo = () => {
      if (isPrivate) {
        return {
          color: "#8c8c8c",
          borderColor: "#d9d9d9",
          tagColor: "default",
          statusText: "HIDDEN",
          statusIcon: <EyeInvisibleOutlined />,
        };
      }

      if (!bet.game_bet?.result) {
        return {
          color: "#1890ff",
          borderColor: "#1890ff",
          tagColor: "blue",
          statusText: "ACTIVE",
          statusIcon: null,
        };
      }

      switch (bet.game_bet.result) {
        case "win":
          return {
            color: "#52c41a",
            borderColor: "#52c41a",
            tagColor: "green",
            statusText: "WIN",
            statusIcon: null,
          };
        case "loss":
          return {
            color: "#ff4d4f",
            borderColor: "#ff4d4f",
            tagColor: "red",
            statusText: "LOSS",
            statusIcon: null,
          };
        case "push":
          return {
            color: "#faad14",
            borderColor: "#faad14",
            tagColor: "orange",
            statusText: "PUSH",
            statusIcon: null,
          };
        default:
          return {
            color: "#1890ff",
            borderColor: "#1890ff",
            tagColor: "blue",
            statusText: "PENDING",
            statusIcon: null,
          };
      }
    };

    const statusInfo = getBetStatusInfo();

    return (
      <Card
        key={`${bet.user_id}-${bet.game_id}-${bet.points_wagered}`}
        size="small"
        style={{
          marginBottom: "8px",
          border: `2px solid ${statusInfo.borderColor}`,
          borderRadius: "8px",
          backgroundColor: isPrivate ? "#fafafa" : "white",
        }}
        bodyStyle={{ padding: "12px" }}
      >
        <Row justify="space-between" align="middle">
          <Col span={16}>
            <Space direction="vertical" size="small" style={{ width: "100%" }}>
              {!isPrivate && (
                <>
                  {isMobile ? (
                    <div>
                      <Text strong style={{ fontSize: "16px" }}>
                        {awayTeam} @ {homeTeam}
                      </Text>
                      <div style={{ marginTop: 6 }}>
                        <Tag color={statusInfo.tagColor} size="small">
                          {statusInfo.statusIcon} {statusInfo.statusText}
                        </Tag>
                      </div>
                    </div>
                  ) : (
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <Text strong style={{ fontSize: "16px" }}>
                        {awayTeam} @ {homeTeam}
                      </Text>
                      <Tag color={statusInfo.tagColor} size="small">
                        {statusInfo.statusIcon} {statusInfo.statusText}
                      </Tag>
                    </div>
                  )}
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <Text type="secondary" style={{ fontSize: "12px" }}>
                      {betDate}
                    </Text>
                    {/* action buttons moved to the bottom of the card */}
                  </div>
                </>
              )}

              {isPrivate && (
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <Space size="small">
                    <EyeInvisibleOutlined style={{ color: "#8c8c8c" }} />
                    <Text type="secondary" style={{ fontSize: "12px" }}>
                      Bet details hidden until game starts
                    </Text>
                  </Space>
                  <Tag color={statusInfo.tagColor} size="small">
                    {statusInfo.statusIcon} {statusInfo.statusText}
                  </Tag>
                </div>
              )}

              {!isPrivate && bet.game_bet && (
                <div>
                  <Space size="small" wrap>
                    <Tag color="blue" size="small">
                      {bet.game_bet.bet_type === "spread" ? "Spread" : "Total"}
                    </Tag>
                    <Text
                      style={{
                        fontSize: "13px",
                        color: statusInfo.color,
                        fontWeight: "500",
                      }}
                    >
                      {bet.game_bet.bet_type === "spread"
                        ? (() => {
                            const teamChoice = bet.game_bet.team_choice;
                            let teamName = teamChoice;
                            if (teamChoice === "home") teamName = homeTeam;
                            else if (teamChoice === "away") teamName = awayTeam;
                            const displaySpread = computeDisplayedSpread(bet);
                            return `${teamName} ${displaySpread}`;
                          })()
                        : `${bet.game_bet.over_under_choice?.toUpperCase()} ${totalValue || "TBD"}`}
                    </Text>
                  </Space>
                </div>
              )}

              {/* Show game scores when available */}
              {!isPrivate && <ScoreDisplay bet={bet} mode="compact" />}
            </Space>
          </Col>

          <Col span={8} style={{ textAlign: "right" }}>
            <Space direction="vertical" size="small" align="end">
              <Text
                strong
                style={{ color: statusInfo.color, fontSize: "16px" }}
              >
                {bet.points_wagered} pts
              </Text>
              {bet.total_points_earned && (
                <Text
                  style={{
                    fontSize: "12px",
                    color: bet.total_points_earned > 0 ? "#52c41a" : "#ff4d4f",
                    fontWeight: "500",
                  }}
                >
                  Earned: {bet.total_points_earned > 0 ? "+" : ""}
                  {bet.total_points_earned}
                </Text>
              )}
            </Space>
          </Col>
        </Row>

        {/* Bottom action row - only visible when bet details are visible */}
        {!isPrivate && (bet.bet_id || bet.game_id) && (
          <div
            style={{
              display: "flex",
              justifyContent: "flex-start",
              gap: 12,
              marginTop: 8,
            }}
          >
            {bet.bet_id && (
              <Button
                size="small"
                type="link"
                onClick={() => alert(`Bet ID: ${bet.bet_id}`)}
                style={{ fontSize: "12px", padding: "0 6px" }}
              >
                View Bet ID
              </Button>
            )}
            {bet.game_id && (
              <Button
                size="small"
                type="link"
                href={`https://www.espn.com/nfl/game?gameId=${bet.game_id}`}
                target="_blank"
                rel="noopener noreferrer"
                icon={<LinkOutlined />}
                style={{ fontSize: "12px", padding: "0 6px" }}
              >
                View on ESPN
              </Button>
            )}
          </div>
        )}

        <Divider style={{ margin: "8px 0" }} />
      </Card>
    );
  };

  // No loading/error UI since data comes from parent

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
                  renderBetCard={renderBetCard}
                />
              ) : (
                <RoomBetsTable
                  userStats={userStats}
                  userStatsColumns={userStatsColumns}
                  expandedUsers={expandedUsers}
                  toggleUserExpansion={toggleUserExpansion}
                  getAvatarStyle={getAvatarStyle}
                  user={user}
                  renderBetCard={renderBetCard}
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
              {currentUserBets.map((bet) => renderBetCard(bet, true))}
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
              {otherUsersBets.map((bet) => renderBetCard(bet, false))}
            </>
          )}
        </>
      )}
    </Card>
  );
};

export default RoomBetsDisplay;
