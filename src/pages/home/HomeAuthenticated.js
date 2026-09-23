import React from "react";
import { Layout, Typography, Card, Space, Tag, Spin } from "antd";
import { Link } from "react-router-dom";
import { useUserProfile } from "../../provider/UserProfileProvider";
import useGetHomeData from "../../hooks/home/useGetHomeData";
import { EyeInvisibleOutlined } from "@ant-design/icons";
import { Collapse, Row, Col } from "antd";
import TrophyIndicators from "../../components/bet/TrophyIndicators";
import { formatPlacedBetSpread } from "../../utils/spreadFormat";
const { Content } = Layout;
const { Title, Text } = Typography;

const HomeAuthenticated = () => {
  const { userProfile } = useUserProfile();
  const { rooms, isLoading, isError, error, refetch } = useGetHomeData(true);

  const renderBetCardOrPrompt = (bet, pointLabel) => {
    if (!bet) {
      return (
        <Card
          size="small"
          style={{
            background: "#fffbe6",
            border: "1px solid #faad14",
            marginBottom: 8,
          }}
        >
          <Tag color="orange">NEED TO PLACE {pointLabel.toUpperCase()} BET</Tag>
        </Card>
      );
    }
    const isPrivate = !bet.game_bet;
    const betDate = bet.event_datetime
      ? new Date(bet.event_datetime * 1000).toLocaleDateString()
      : "Unknown";
    let homeTeam = "Home Team";
    let awayTeam = "Away Team";
    if (bet.odds_snapshot?.teams) {
      const { home, away } = bet.odds_snapshot.teams;
      if (home?.name) homeTeam = home.name;
      if (away?.name) awayTeam = away.name;
    }
    const totalValue =
      bet.game_bet?.total_value || bet.odds_snapshot?.overUnder;
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
              <Text type="secondary" style={{ fontSize: "12px" }}>
                {betDate}
              </Text>
              {bet.game_bet && (
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
                            return `${teamName} ${formatPlacedBetSpread(bet)}`;
                          })()
                        : `${bet.game_bet.over_under_choice?.toUpperCase()} ${totalValue || "TBD"}`}
                    </Text>
                  </Space>
                </div>
              )}
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
              {bet.total_points_earned !== undefined &&
                bet.total_points_earned !== null && (
                  <Text
                    style={{
                      fontSize: "12px",
                      color:
                        bet.total_points_earned > 0 ? "#52c41a" : "#ff4d4f",
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
      </Card>
    );
  };

  const renderBetSlots = (room) => {
    const bets = room.bets || {};
    if (room.room_sport === "MLB") {
      const regs = bets.regular_bets || [];
      return (
        <>
          {renderBetCardOrPrompt(regs[0] || null, "1pt bet #1")}
          {renderBetCardOrPrompt(regs[1] || null, "1pt bet #2")}
          {renderBetCardOrPrompt(regs[2] || null, "1pt bet #3")}
          {renderBetCardOrPrompt(regs[3] || null, "1pt bet #4")}
          {renderBetCardOrPrompt(bets.big_bet || null, "6pt big bet")}
        </>
      );
    }
    return (
      <>
        {renderBetCardOrPrompt(bets.one_point || null, "one point")}
        {renderBetCardOrPrompt(bets.two_point || null, "two point")}
        {renderBetCardOrPrompt(bets.three_point || null, "three point")}
      </>
    );
  };

  const calculateTotalPoints = (room) => {
    const bets = room.bets || {};
    let allBets = [];
    if (room.room_sport === "MLB") {
      allBets = [...(bets.regular_bets || []), bets.big_bet].filter(Boolean);
    } else {
      allBets = [bets.one_point, bets.two_point, bets.three_point].filter(
        Boolean,
      );
    }
    return allBets.reduce(
      (sum, bet) => sum + (bet.total_points_earned || 0),
      0,
    );
  };

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Content style={{ padding: "32px 16px 0 16px" }}>
        <div style={{ textAlign: "center", marginTop: "16px" }}>
          <Title level={2} style={{ marginBottom: 8 }}>
            Welcome to Fortunas
          </Title>
          <Text>{`You have signed in as ${userProfile?.name || "User"}`}</Text>
        </div>
        <div style={{ maxWidth: 600, margin: "32px auto 0 auto" }}>
          <Title level={3} style={{ margin: "0 0 16px 0", textAlign: "left" }}>
            Your Rooms
          </Title>
          {isLoading ? (
            <Spin size="large" />
          ) : isError ? (
            <Card style={{ marginBottom: 16 }}>
              <Text type="danger">
                Error loading rooms: {error?.message || "Unknown error"}
              </Text>
            </Card>
          ) : rooms && rooms.length > 0 ? (
            rooms.map((room) => (
              <Card
                style={{ marginBottom: 12, boxShadow: "0 2px 8px #f0f1f2" }}
                key={room.room_id}
                bodyStyle={{ padding: "16px 20px" }}
              >
                <Space direction="vertical" style={{ width: "100%" }}>
                  <Link
                    to={`/room/${room.room_id}`}
                    style={{
                      fontWeight: 600,
                      fontSize: 18,
                      color: "#1890ff",
                      textDecoration: "none",
                    }}
                  >
                    {room.room_name || room.room_id}
                  </Link>
                  <Collapse
                    accordion
                    size="small"
                    style={{ background: "#f6faff" }}
                  >
                    <Collapse.Panel
                      header={
                        <span
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 12,
                          }}
                        >
                          Your Bets for This Week
                          <TrophyIndicators
                            sport={room.room_sport}
                            bets={room.bets}
                          />
                        </span>
                      }
                      key="bets"
                    >
                      <div style={{ marginBottom: 8 }}>
                        {renderBetSlots(room)}
                      </div>
                      <div style={{ textAlign: "right", marginTop: 8 }}>
                        <Tag
                          color="#52c41a"
                          style={{ fontSize: 15, fontWeight: 600 }}
                        >
                          Total Points Won: {calculateTotalPoints(room)}
                        </Tag>
                      </div>
                    </Collapse.Panel>
                  </Collapse>
                </Space>
              </Card>
            ))
          ) : (
            <Text type="secondary">You are not a member of any rooms yet.</Text>
          )}
        </div>
      </Content>
    </Layout>
  );
};

export default HomeAuthenticated;
