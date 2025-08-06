import React, { useState } from "react";
import { Card, Space, Avatar, Tag, Typography, Button, Divider } from "antd";
import { UserOutlined, DownOutlined, RightOutlined } from "@ant-design/icons";

const { Text } = Typography;

const RoomBetsCards = ({ userStats, getAvatarStyle, user, renderBetCard }) => {
  const [expandedUsers, setExpandedUsers] = useState({});

  const toggleUserExpansion = (userId) => {
    setExpandedUsers((prev) => ({
      ...prev,
      [userId]: !prev[userId],
    }));
  };

  return (
    <div className="bet-history-mobile-wrapper">
      {userStats.map((userStat) => (
        <Card
          key={userStat.user_id}
          size="small"
          style={{ marginBottom: "16px" }}
          bodyStyle={{ padding: "12px" }}
        >
          <Space direction="vertical" style={{ width: "100%" }}>
            <Space>
              <Avatar
                icon={<UserOutlined />}
                size="small"
                style={getAvatarStyle(userStat.user_color)}
              />
              <Text strong={userStat.user_id === user?.user_id}>
                {userStat.user_id === user?.user_id
                  ? "You"
                  : userStat.user_name}
              </Text>
              {userStat.user_id === user?.user_id && (
                <Tag color="green" size="small">
                  Your Stats
                </Tag>
              )}
            </Space>
            <Space wrap>
              <Text>
                Total Bets: <strong>{userStat.total_bets}</strong>
              </Text>
              <Text>
                Bets Won: <strong>{userStat.bets_won}</strong>
              </Text>
              <Text>
                Points: <strong>{userStat.points_total}</strong>
              </Text>
            </Space>
            <Button
              size="small"
              type="link"
              icon={
                expandedUsers[userStat.user_id] ? (
                  <DownOutlined />
                ) : (
                  <RightOutlined />
                )
              }
              onClick={() => toggleUserExpansion(userStat.user_id)}
              style={{ paddingLeft: 0 }}
            >
              {expandedUsers[userStat.user_id] ? "Hide Bets" : "View All Bets"}
            </Button>
            {expandedUsers[userStat.user_id] && (
              <>
                <Divider style={{ margin: "8px 0" }} />
                {userStat.bets.map((bet) =>
                  renderBetCard(bet, userStat.user_id === user?.user_id),
                )}
              </>
            )}
          </Space>
        </Card>
      ))}
    </div>
  );
};

export default RoomBetsCards;
