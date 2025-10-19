import React, { useState } from "react";
import { Card, Space, Avatar, Tag, Typography, Button, Divider } from "antd";
import { UserOutlined, DownOutlined, RightOutlined } from "@ant-design/icons";
import WeekHeader from "./WeekHeader";

const { Text } = Typography;

const RoomBetsCards = ({ userStats, getAvatarStyle, user, renderBetCard }) => {
  const [expandedUsers, setExpandedUsers] = useState({});
  // track expanded weeks per user: { [userId]: { [week]: boolean } }
  const [expandedWeeks, setExpandedWeeks] = useState({});

  const toggleUserExpansion = (userId) => {
    setExpandedUsers((prev) => ({
      ...prev,
      [userId]: !prev[userId],
    }));
  };

  const toggleWeek = (userId, week) => {
    setExpandedWeeks((prev) => ({
      ...prev,
      [userId]: {
        ...(prev[userId] || {}),
        [week]: !(prev[userId] || {})[week],
      },
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
              <Text
                strong={userStat.user_id === user?.user_id}
                style={{ wordBreak: "break-word" }} // Ensure long names wrap to a new line
              >
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
                {/* Group bets by week for mobile view */}
                {(() => {
                  const byWeek = {};
                  userStat.bets.forEach((bet) => {
                    const w = bet.week ?? "Unknown";
                    if (!byWeek[w]) byWeek[w] = [];
                    byWeek[w].push(bet);
                  });

                  // Sort weeks descending (numerically when possible)
                  const weeks = Object.keys(byWeek).sort((a, b) => {
                    const na = isNaN(Number(a)) ? -1 : Number(a);
                    const nb = isNaN(Number(b)) ? -1 : Number(b);
                    return nb - na;
                  });

                  return weeks.map((week) => (
                    <div
                      key={`${userStat.user_id}-week-${week}`}
                      style={{ marginBottom: 12 }}
                    >
                      <WeekHeader
                        week={week}
                        bets={byWeek[week]}
                        expanded={
                          !!(expandedWeeks[userStat.user_id] || {})[week]
                        }
                        onToggle={() => toggleWeek(userStat.user_id, week)}
                      />
                      {(expandedWeeks[userStat.user_id] || {})[week] && (
                        <div style={{ marginTop: 8 }}>
                          {byWeek[week].map((bet) =>
                            renderBetCard(
                              bet,
                              userStat.user_id === user?.user_id,
                            ),
                          )}
                        </div>
                      )}
                    </div>
                  ));
                })()}
              </>
            )}
          </Space>
        </Card>
      ))}
    </div>
  );
};

export default RoomBetsCards;
