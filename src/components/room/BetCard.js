import React from "react";
import { Card, Row, Col, Typography, Tag, Space, Divider, Button } from "antd";
import {
  EyeInvisibleOutlined,
  LinkOutlined,
  EditOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
import ScoreDisplay from "./ScoreDisplay";
import computeDisplayedSpread from "../../utils/spreadUtils";

const { Text } = Typography;

const getBetStatusInfo = (bet, isPrivate) => {
  if (bet.status === "removed") {
    return {
      color: "#8c8c8c",
      borderColor: "#d9d9d9",
      tagColor: "default",
      statusText: "REMOVED",
      statusIcon: <DeleteOutlined />,
    };
  }

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

const BetCard = ({
  bet,
  isCurrentUser = false,
  isMobile = false,
  onEditBet,
  onRemoveBet,
}) => {
  const isRemoved = bet.status === "removed";
  const isPrivate = !isRemoved && !bet.game_bet && !isCurrentUser;

  // Determine if the game hasn't started yet (bet is editable)
  const now = Math.floor(Date.now() / 1000);
  const gameNotStarted =
    bet.event_datetime && bet.event_datetime > now && !bet.game_bet?.result;

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
  const totalValue = bet.game_bet?.total_value || bet.odds_snapshot?.overUnder;

  const statusInfo = getBetStatusInfo(bet, isPrivate);

  return (
    <Card
      key={`${bet.user_id}-${bet.game_id}-${bet.points_wagered}`}
      size="small"
      style={{
        marginBottom: "8px",
        border: `2px solid ${statusInfo.borderColor}`,
        borderRadius: "8px",
        backgroundColor: isPrivate
          ? "#fafafa"
          : isRemoved
            ? "#f5f5f5"
            : "white",
        opacity: isRemoved ? 0.7 : 1,
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
            {!isPrivate && !isRemoved && (
              <ScoreDisplay bet={bet} mode="compact" />
            )}

            {/* Show removal timestamp for removed bets */}
            {isRemoved && bet.removed_at && (
              <Text
                type="secondary"
                style={{ fontSize: "11px", fontStyle: "italic" }}
              >
                Removed on{" "}
                {new Date(bet.removed_at * 1000).toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                  hour: "numeric",
                  minute: "2-digit",
                })}
              </Text>
            )}
          </Space>
        </Col>

        <Col span={8} style={{ textAlign: "right" }}>
          <Space direction="vertical" size="small" align="end">
            <Text strong style={{ color: statusInfo.color, fontSize: "16px" }}>
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
      {!isPrivate && !isRemoved && (bet.bet_id || bet.game_id) && (
        <div
          style={{
            display: "flex",
            justifyContent: "flex-start",
            gap: 12,
            marginTop: 8,
          }}
        >
          {isCurrentUser && gameNotStarted && onEditBet && (
            <Button
              size="small"
              type="link"
              icon={<EditOutlined />}
              onClick={() => onEditBet(bet)}
              style={{ fontSize: "12px", padding: "0 6px" }}
            >
              Edit Bet
            </Button>
          )}
          {isCurrentUser && gameNotStarted && onRemoveBet && (
            <Button
              size="small"
              type="link"
              danger
              icon={<DeleteOutlined />}
              onClick={() => onRemoveBet(bet)}
              style={{ fontSize: "12px", padding: "0 6px" }}
            >
              Remove Bet
            </Button>
          )}
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
              href={`https://www.espn.com/${bet.sport === "baseball" ? "mlb" : "nfl"}/game?gameId=${bet.game_id}`}
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

export default BetCard;
